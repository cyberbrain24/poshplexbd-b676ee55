import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";

const STEADFAST_BASE_URL = "https://portal.packzy.com/api/v1";

interface SteadfastOrderPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city?: string;
  recipient_area?: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  alternative_phone?: string;
  recipient_email?: string;
  delivery_type?: number;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("88") && cleaned.length === 13) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith("1") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  if (cleaned.length === 11 && cleaned.startsWith("01")) {
    return cleaned;
  }
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
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  // Rate limiting
  const ip = getClientIP(req);
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return rateLimitResponse(corsHeaders, retryAfter);
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

    // Admin role check — courier operations are admin-only
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "create_order": {
        const body = await req.json();
        const { order_id } = body;

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
            shipping_thana:thanas(name),
            customer:customers(name, phone, email)
          `)
          .eq("id", order_id)
          .single();

        if (orderError || !order) {
          return new Response(
            JSON.stringify({ error: "Order not found", details: orderError }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const itemDescription = order.order_items
          ?.map((item: { product_name: string; quantity: number; variant_sku?: string }) => 
            `${item.product_name} x${item.quantity}${item.variant_sku ? ` (${item.variant_sku})` : ''}`
          )
          .join(", ") || "";

        const addressParts = [
          order.shipping_address,
          order.shipping_thana?.name,
          order.shipping_division?.name
        ].filter(Boolean);
        const fullAddress = addressParts.join(", ");

        const paidAmount = Number(order.paid_amount) || 0;
        const dueAmount = Math.max(0, Number(order.total_amount) - paidAmount);

        const recipientName = order.customer?.name || order.shipping_name;
        const recipientPhone = order.customer?.phone || order.shipping_phone;
        const recipientEmail = order.customer?.email || order.shipping_email;

        const formattedPhone = formatPhoneNumber(recipientPhone);
        
        if (!formattedPhone || formattedPhone.length !== 11 || !formattedPhone.startsWith("01")) {
          console.error(`[Steadfast] Invalid phone number: ${recipientPhone} -> ${formattedPhone}`);
          return new Response(
            JSON.stringify({ 
              status: 400, 
              errors: { 
                recipient_phone: [`Invalid phone format. Expected 11-digit Bangladeshi number starting with 01. Got: ${formattedPhone}`] 
              }
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const payload: SteadfastOrderPayload = {
          invoice: order.order_number,
          recipient_name: recipientName,
          recipient_phone: formattedPhone,
          recipient_address: fullAddress,
          recipient_city: order.shipping_division?.name || undefined,
          recipient_area: order.shipping_thana?.name || undefined,
          cod_amount: dueAmount,
          note: order.customer_notes || undefined,
          item_description: itemDescription,
          recipient_email: recipientEmail || undefined,
          delivery_type: 0,
        };

        console.log(`[Steadfast] Creating order with payload:`, JSON.stringify(payload));

        const result = await steadfastRequest("/create_order", "POST", payload);

        if (result.status === 200 && result.data.consignment) {
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

          const addressParts = [
            order.shipping_address,
            order.shipping_thana?.name,
            order.shipping_division?.name
          ].filter(Boolean);
          const fullAddress = addressParts.join(", ");

          const paidAmount = Number(order.paid_amount) || 0;
          const dueAmount = Math.max(0, Number(order.total_amount) - paidAmount);

          return {
            invoice: order.order_number,
            recipient_name: order.shipping_name,
            recipient_phone: formatPhoneNumber(order.shipping_phone),
            recipient_address: fullAddress,
            recipient_city: order.shipping_division?.name || undefined,
            recipient_area: order.shipping_thana?.name || undefined,
            cod_amount: dueAmount,
            note: order.customer_notes || "",
            item_description: itemDescription,
          };
        });

        const result = await steadfastRequest("/create_order/bulk-order", "POST", {
          data: JSON.stringify(bulkData),
        });

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
        const result = await steadfastRequest("/police_stations");
        
        if (result.status !== 200 || !result.data) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch police stations from Steadfast", status: result.status }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ message: "Location sync completed", data: result.data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[Steadfast] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
