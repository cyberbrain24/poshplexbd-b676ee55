// Public-callable transactional SMS for newly created orders.
// Only sends if the order was created in the last 5 minutes (anti-abuse).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendByEvent } from "../_shared/sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { order_id } = await req.json();
    if (!order_id) return new Response(JSON.stringify({ error: "order_id required" }), { status: 400, headers: corsHeaders });

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: order } = await sb
      .from("orders")
      .select("id, order_number, shipping_name, shipping_phone, total_amount, customer_id, created_at")
      .eq("id", order_id)
      .maybeSingle();

    if (!order) return new Response(JSON.stringify({ error: "Order not found" }), { status: 404, headers: corsHeaders });

    const ageMs = Date.now() - new Date(order.created_at).getTime();
    if (ageMs > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Order too old for transactional SMS" }), { status: 403, headers: corsHeaders });
    }
    if (!order.shipping_phone) {
      return new Response(JSON.stringify({ skipped: true, reason: "No phone" }), { headers: corsHeaders });
    }

    const result = await sendByEvent(sb, "order_placed", order.shipping_phone, {
      name: order.shipping_name || "Customer",
      order_number: order.order_number,
      total: Math.round(Number(order.total_amount || 0)).toString(),
      phone: order.shipping_phone,
    }, { customer_id: order.customer_id, order_id: order.id });

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("sms-order-placed error", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
