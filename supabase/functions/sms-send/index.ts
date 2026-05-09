// Generic SMS send endpoint: single, by-event, or bulk.
// Admin-only (validates user_roles).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logAndSend, sendByEvent, renderTemplate } from "../_shared/sms.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  const sbA = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data } = await sbA.auth.getUser(token);
  if (!data?.user) return null;
  const { data: role } = await sbA.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  if (!role) return null;
  return data.user;
}

async function resolveAudience(sb: any, filter: any): Promise<{ phone: string; customer_id?: string; name?: string }[]> {
  const type = filter?.type || "all";

  if (type === "manual") {
    const phones: string[] = Array.isArray(filter.phones) ? filter.phones : [];
    return phones
      .map(p => String(p || "").trim())
      .filter(Boolean)
      .map(phone => ({ phone }));
  }

  let q = sb.from("customers").select("id, name, phone").not("phone", "is", null).eq("is_active", true);
  if (type === "membership" && Array.isArray(filter.ids) && filter.ids.length) {
    q = q.in("customer_type_id", filter.ids);
  } else if (type === "division" && Array.isArray(filter.ids) && filter.ids.length) {
    q = q.in("division_id", filter.ids);
  } else if (type === "thana" && Array.isArray(filter.ids) && filter.ids.length) {
    q = q.in("thana_id", filter.ids);
  }
  const { data } = await q.limit(10000);
  return (data || []).filter((c: any) => c.phone).map((c: any) => ({ phone: c.phone, customer_id: c.id, name: c.name }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await requireAdmin(req);
    if (!user) return json({ error: "Admin only" }, 403);

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = await req.json();
    const action = body.action || "single";

    // ---- Single SMS ----
    if (action === "single") {
      const { phone, message, customer_id, order_id } = body;
      if (!phone || !message) return json({ error: "phone and message required" }, 400);
      const result = await logAndSend(sb, {
        phone, body: message, customer_id, order_id,
        trigger_event: "manual",
      });
      return json(result);
    }

    // ---- Send by template event ----
    if (action === "event") {
      const { event_key, phone, context, customer_id, order_id } = body;
      if (!event_key || !phone) return json({ error: "event_key and phone required" }, 400);
      const result = await sendByEvent(sb, event_key, phone, context || {}, { customer_id, order_id });
      return json(result);
    }

    // ---- Bulk campaign ----
    if (action === "bulk") {
      const { name, message, audience_filter, save_campaign = true } = body;
      if (!message) return json({ error: "message required" }, 400);

      const recipients = await resolveAudience(sb, audience_filter || { type: "all" });
      if (!recipients.length) return json({ error: "No recipients matched the filter" }, 400);

      let campaign_id: string | null = null;
      if (save_campaign) {
        const { data: c, error: cErr } = await sb.from("sms_campaigns").insert({
          name: name || `Campaign ${new Date().toISOString()}`,
          body: message,
          audience_filter: audience_filter || { type: "all" },
          recipient_count: recipients.length,
          status: "sending",
          created_by: user.id,
        }).select().single();
        if (cErr) return json({ error: cErr.message }, 500);
        campaign_id = c.id;
      }

      let sent = 0, failed = 0;
      for (const r of recipients) {
        const personalised = renderTemplate(message, { name: r.name || "", phone: r.phone });
        const res = await logAndSend(sb, {
          phone: r.phone,
          body: personalised,
          customer_id: r.customer_id || null,
          campaign_id,
          trigger_event: "bulk",
        });
        if (res.success) sent++; else failed++;
      }

      if (campaign_id) {
        await sb.from("sms_campaigns").update({
          sent_count: sent,
          failed_count: failed,
          status: "completed",
          completed_at: new Date().toISOString(),
        }).eq("id", campaign_id);
      }

      return json({ success: true, recipients: recipients.length, sent, failed, campaign_id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("sms-send error", e);
    return json({ error: e.message || "Server error" }, 500);
  }
});
