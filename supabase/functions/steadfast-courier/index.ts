import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: string; // District name
  recipient_area?: string; // Thana/Area name
  cod_amount: number;
  note?: string;
  item_description?: string;
  alternative_phone?: string;
  recipient_email?: string;
  delivery_type?: number; // 0 = home delivery, 1 = point delivery
}

/**
 * Format phone number to valid Bangladeshi format for Steadfast API
 * Steadfast requires 11-digit numbers starting with 01
 */
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Handle +88 prefix
  if (cleaned.startsWith("88") && cleaned.length === 13) {
    cleaned = cleaned.substring(2);
  }
  
  // Handle 88 prefix without +
  if (cleaned.startsWith("88") && cleaned.length === 13) {
    cleaned = cleaned.substring(2);
  }
  
  // If starts with 1 and is 10 digits, add leading 0
  if (cleaned.startsWith("1") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  
  // If doesn't start with 0 and is 10 digits, add leading 0
  if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  
  // Validate: must be 11 digits starting with 01
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    return cleaned;
  }
  
  // Return original cleaned number if we can't fix it
  // Steadfast will reject it, but at least we tried
  console.log(`[Steadfast] Could not normalize phone: ${phone} -> ${cleaned}`);
  return cleaned;
}

async function steadfastRequest(
  endpoint: string,
  method: string = "GET",
  body?: unknown
) {
  const apiKey = Deno.env.get("STEADFAST_API_KEY");
  const secretKey = Deno.env.get("STEADFAST_SECRET_KEY");

  if (!apiKey || !secretKey) {
    throw new Error("Steadfast API credentials not configured");
  }

  const options: RequestInit = {
    method,
    headers: {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  console.log(`[Steadfast] ${method} ${endpoint}`);
  const response = await fetch(`${STEADFAST_BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  console.log(`[Steadfast] Response status: ${response.status}`);
  return { status: response.status, data };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    
    if (userError || !user) {
      console.error("[Steadfast] Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Route based on action
    switch (action) {
      case "create_order": {
        const body = await req.json();
        const { order_id } = body;

        // Fetch order details from database with division and thana names
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(
              product_name,
              quantity,
              unit_price,
              variant_sku
            ),
            shipping_division:divisions(name),
            shipping_thana:thanas(name)
          `)
          .eq("id", order_id)
          .single();

        if (orderError || !order) {
          return new Response(
            JSON.stringify({ error: "Order not found", details: orderError }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build item description from order items
        const itemDescription = order.order_items
          ?.map((item: { product_name: string; quantity: number; variant_sku?: string }) => 
            `${item.product_name} x${item.quantity}${item.variant_sku ? ` (${item.variant_sku})` : ''}`
          )
          .join(", ") || "";

        // Build comprehensive address with thana and district
        const addressParts = [
          order.shipping_address,
          order.shipping_thana?.name,
          order.shipping_division?.name
        ].filter(Boolean);
        const fullAddress = addressParts.join(", ");

        // Calculate due amount (total - already paid)
        const paidAmount = Number(order.paid_amount) || 0;
        const dueAmount = Math.max(0, Number(order.total_amount) - paidAmount);

        const payload: SteadfastOrderPayload = {
          invoice: order.order_number,
          recipient_name: order.shipping_name,
          recipient_phone: formatPhoneNumber(order.shipping_phone),
          recipient_address: fullAddress,
          recipient_city: order.shipping_division?.name || undefined,
          recipient_area: order.shipping_thana?.name || undefined,
          cod_amount: dueAmount, // Send only the remaining due amount
          note: order.customer_notes || undefined,
          item_description: itemDescription,
          recipient_email: order.shipping_email || undefined,
          delivery_type: 0, // Home delivery
        };

        console.log(`[Steadfast] Creating order with payload:`, JSON.stringify(payload));

        const result = await steadfastRequest("/create_order", "POST", payload);

        if (result.status === 200 && result.data.consignment) {
          // Update order with tracking info and consignment ID
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              tracking_number: result.data.consignment.tracking_code,
              consignment_id: String(result.data.consignment.consignment_id),
              courier_name: "Steadfast",
              order_status: "processing",
            })
            .eq("id", order_id);

          if (updateError) {
            console.error("[Steadfast] Failed to update order:", updateError);
          }
        }

        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "bulk_create": {
        const body = await req.json();
        const { order_ids } = body;

        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
          return new Response(
            JSON.stringify({ error: "order_ids array is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Fetch all orders with division and thana
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(product_name, quantity, variant_sku),
            shipping_division:divisions(name),
            shipping_thana:thanas(name)
          `)
          .in("id", order_ids);

        if (ordersError || !orders) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch orders", details: ordersError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const bulkData = orders.map((order) => {
          const itemDescription = order.order_items
            ?.map((item: { product_name: string; quantity: number; variant_sku?: string }) => 
              `${item.product_name} x${item.quantity}`
            )
            .join(", ") || "";

          // Build comprehensive address
          const addressParts = [
            order.shipping_address,
            order.shipping_thana?.name,
            order.shipping_division?.name
          ].filter(Boolean);
          const fullAddress = addressParts.join(", ");

          // Calculate due amount (total - already paid)
          const paidAmount = Number(order.paid_amount) || 0;
          const dueAmount = Math.max(0, Number(order.total_amount) - paidAmount);

          return {
            invoice: order.order_number,
            recipient_name: order.shipping_name,
            recipient_phone: formatPhoneNumber(order.shipping_phone),
            recipient_address: fullAddress,
            recipient_city: order.shipping_division?.name || undefined,
            recipient_area: order.shipping_thana?.name || undefined,
            cod_amount: dueAmount, // Send only the remaining due amount
            note: order.customer_notes || "",
            item_description: itemDescription,
          };
        });

        const result = await steadfastRequest("/create_order/bulk-order", "POST", {
          data: JSON.stringify(bulkData),
        });

        // Update orders with tracking codes
        if (result.status === 200 && Array.isArray(result.data)) {
          for (const consignment of result.data) {
            if (consignment.status === "success" && consignment.tracking_code) {
              const order = orders.find((o) => o.order_number === consignment.invoice);
              if (order) {
                await supabase
                  .from("orders")
                  .update({
                    tracking_number: consignment.tracking_code,
                    consignment_id: String(consignment.consignment_id),
                    courier_name: "Steadfast",
                    order_status: "processing",
                  })
                  .eq("id", order.id);
              }
            }
          }
        }

        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "track_by_consignment": {
        const consignmentId = url.searchParams.get("consignment_id");
        if (!consignmentId) {
          return new Response(
            JSON.stringify({ error: "consignment_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const result = await steadfastRequest(`/status_by_cid/${consignmentId}`);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "track_by_invoice": {
        const invoice = url.searchParams.get("invoice");
        if (!invoice) {
          return new Response(
            JSON.stringify({ error: "invoice is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const result = await steadfastRequest(`/status_by_invoice/${invoice}`);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "track_by_tracking_code": {
        const trackingCode = url.searchParams.get("tracking_code");
        if (!trackingCode) {
          return new Response(
            JSON.stringify({ error: "tracking_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const result = await steadfastRequest(`/status_by_trackingcode/${trackingCode}`);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_balance": {
        const result = await steadfastRequest("/get_balance");
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_return": {
        const body = await req.json();
        const { consignment_id, invoice, tracking_code, reason } = body;

        if (!consignment_id && !invoice && !tracking_code) {
          return new Response(
            JSON.stringify({ error: "consignment_id, invoice, or tracking_code is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const payload: Record<string, string> = {};
        if (consignment_id) payload.consignment_id = consignment_id;
        if (invoice) payload.invoice = invoice;
        if (tracking_code) payload.tracking_code = tracking_code;
        if (reason) payload.reason = reason;

        const result = await steadfastRequest("/create_return_request", "POST", payload);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_return": {
        const returnId = url.searchParams.get("return_id");
        if (!returnId) {
          return new Response(
            JSON.stringify({ error: "return_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const result = await steadfastRequest(`/get_return_request/${returnId}`);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_returns": {
        const result = await steadfastRequest("/get_return_requests");
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_payments": {
        const result = await steadfastRequest("/payments");
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_payment": {
        const paymentId = url.searchParams.get("payment_id");
        if (!paymentId) {
          return new Response(
            JSON.stringify({ error: "payment_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const result = await steadfastRequest(`/payments/${paymentId}`);
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_police_stations": {
        const result = await steadfastRequest("/police_stations");
        return new Response(
          JSON.stringify(result.data),
          { status: result.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_locations": {
        // Fetch police stations from Steadfast API
        const result = await steadfastRequest("/police_stations");
        
        if (result.status !== 200 || !result.data) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch police stations from Steadfast", status: result.status }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log the raw response to understand the structure
        const rawData = result.data;
        console.log("[Steadfast] Raw response type:", typeof rawData);
        console.log("[Steadfast] Is array:", Array.isArray(rawData));
        
        if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
          console.log("[Steadfast] Response keys:", Object.keys(rawData));
          // Log first few characters of stringified to understand structure
          const preview = JSON.stringify(rawData).substring(0, 500);
          console.log("[Steadfast] Response preview:", preview);
        }
        
        // The API might return data in different nested structures
        let policeStations: unknown[] = [];
        
        if (Array.isArray(rawData)) {
          policeStations = rawData;
        } else if (rawData && typeof rawData === 'object') {
          // Try various possible keys where data might be nested
          const possibleKeys = ['data', 'police_stations', 'areas', 'list', 'items', 'result', 'response'];
          for (const key of possibleKeys) {
            if (Array.isArray((rawData as Record<string, unknown>)[key])) {
              policeStations = (rawData as Record<string, unknown>)[key] as unknown[];
              console.log(`[Steadfast] Found data under key: ${key}`);
              break;
            }
          }
          
          // If still empty, check if keys themselves are districts/areas (object format)
          if (policeStations.length === 0) {
            // Some APIs return { "District1": [...thanas], "District2": [...thanas] }
            const objKeys = Object.keys(rawData as object);
            if (objKeys.length > 0 && !['status', 'message', 'success', 'error'].includes(objKeys[0])) {
              console.log("[Steadfast] Trying object-as-districts format");
              for (const districtName of objKeys) {
                const thanas = (rawData as Record<string, unknown>)[districtName];
                if (Array.isArray(thanas)) {
                  for (const thana of thanas) {
                    policeStations.push({
                      district: districtName,
                      thana: typeof thana === 'string' ? thana : (thana as Record<string, unknown>).name || (thana as Record<string, unknown>).thana
                    });
                  }
                }
              }
            }
          }
        }
        
        console.log("[Steadfast] Extracted police stations count:", policeStations.length);
        if (policeStations.length > 0) {
          console.log("[Steadfast] Sample item:", JSON.stringify(policeStations[0]));
        }
        
        // Extract unique districts and thanas
        const districtsMap = new Map<string, string>();
        const thanasList: { name: string; district: string }[] = [];

        for (const station of policeStations) {
          const s = station as Record<string, unknown>;
          // Try multiple possible field names for district
          const district = String(s.district_name || s.district || s.city || s.area || s.district_eng || "").trim();
          // Try multiple possible field names for thana
          const thana = String(s.thana_name || s.thana || s.name || s.police_station || s.upazila || s.thana_eng || "").trim();
          
          if (district && !districtsMap.has(district.toLowerCase())) {
            districtsMap.set(district.toLowerCase(), district);
          }
          
          if (thana && district) {
            thanasList.push({ name: thana, district: district });
          }
        }
        
        console.log("[Steadfast] Extracted districts:", districtsMap.size);
        console.log("[Steadfast] Extracted thanas:", thanasList.length);

        // Use service role client for admin operations
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Insert districts
        const districtsToInsert = Array.from(districtsMap.values()).map(name => ({
          name,
          is_active: true
        }));

        let insertedDistricts = 0;
        let insertedThanas = 0;

        for (const district of districtsToInsert) {
          const { error } = await serviceClient
            .from("divisions")
            .upsert({ name: district.name, is_active: true }, { onConflict: "name", ignoreDuplicates: true });
          
          if (!error) insertedDistricts++;
        }

        // Fetch all districts to get their IDs
        const { data: allDistricts } = await serviceClient
          .from("divisions")
          .select("id, name");

        const districtIdMap = new Map<string, string>();
        if (allDistricts) {
          for (const d of allDistricts) {
            districtIdMap.set(d.name.toLowerCase(), d.id);
          }
        }

        // Insert thanas
        for (const thana of thanasList) {
          const divisionId = districtIdMap.get(thana.district.toLowerCase());
          if (divisionId) {
            const { error } = await serviceClient
              .from("thanas")
              .upsert(
                { name: thana.name, division_id: divisionId, is_active: true },
                { onConflict: "name,division_id", ignoreDuplicates: true }
              );
            
            if (!error) insertedThanas++;
          }
        }

        console.log(`[Steadfast] Synced ${insertedDistricts} districts and ${insertedThanas} thanas`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Synced locations from Steadfast API`,
            stats: {
              total_police_stations: Array.isArray(policeStations) ? policeStations.length : 0,
              districts_processed: districtsToInsert.length,
              thanas_processed: thanasList.length
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reset_shipping": {
        // Reset shipping data for an order so it can be re-shipped
        const body = await req.json();
        const { order_id } = body;

        if (!order_id) {
          return new Response(
            JSON.stringify({ error: "order_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Use service role client for admin operations
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Reset tracking info on the order including consignment_id
        const { error: updateError } = await serviceClient
          .from("orders")
          .update({
            tracking_number: null,
            consignment_id: null,
            courier_name: null,
            order_status: "confirmed", // Reset to confirmed so it can be shipped again
          })
          .eq("id", order_id);

        if (updateError) {
          console.error("[Steadfast] Failed to reset shipping:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to reset shipping", details: updateError }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log(`[Steadfast] Reset shipping for order: ${order_id}`);

        return new Response(
          JSON.stringify({ success: true, message: "Shipping data reset. Order can be shipped again." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: "Invalid action",
            available_actions: [
              "create_order",
              "bulk_create",
              "track_by_consignment",
              "track_by_invoice",
              "track_by_tracking_code",
              "get_balance",
              "create_return",
              "get_return",
              "get_returns",
              "get_payments",
              "get_payment",
              "get_police_stations",
              "reset_shipping"
            ]
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[Steadfast] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
