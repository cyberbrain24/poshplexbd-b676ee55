// WhatsApp Marketing send endpoint - admin only. Mirrors email-send pattern.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
  const sb = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data } = await sb.auth.getUser(token);
  if (!data?.user) return null;
  const { data: role } = await sb.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  if (!role) return null;
  return data.user;
}

function applyPlaceholders(input: any, vars: Record<string, string>): any {
  if (typeof input === "string") return input.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  if (Array.isArray(input)) return input.map((v) => applyPlaceholders(v, vars));
  if (input && typeof input === "object") {
    const out: any = {};
    for (const k of Object.keys(input)) out[k] = applyPlaceholders(input[k], vars);
    return out;
  }
  return input;
}

function normPhone(p: string): string {
  return String(p || "").replace(/[^\d+]/g, "");
}

async function resolveAudience(sb: any, filter: any): Promise<{ phone: string; name?: string }[]> {
  const type = filter?.type || "all";
  if (type === "manual") {
    const phones: string[] = Array.isArray(filter.phones) ? filter.phones : [];
    return phones.map(normPhone).filter(Boolean).map((phone) => ({ phone }));
  }
  let q = sb.from("customers").select("id, name, phone").not("phone", "is", null).eq("is_active", true);
  if (type === "membership" && Array.isArray(filter.ids) && filter.ids.length) q = q.in("customer_type_id", filter.ids);
  else if (type === "division" && Array.isArray(filter.ids) && filter.ids.length) q = q.in("division_id", filter.ids);
  const { data } = await q.limit(10000);
  return (data || [])
    .filter((c: any) => c.phone)
    .map((c: any) => ({ phone: normPhone(c.phone), name: c.name }));
}

async function sendOne(settings: any, to: string, body: string, mediaUrl: string) {
  const vars: Record<string, string> = {
    api_key: settings.api_key || "",
    business_phone_id: settings.business_phone_id || "",
    sender_display_name: settings.sender_display_name || "POSHPLEX",
    language: settings.default_language || "en",
    to,
    body,
    media_url: mediaUrl || "",
  };
  const endpoint = applyPlaceholders(settings.endpoint_url || "", vars);
  const headers = applyPlaceholders(settings.headers || {}, vars);
  const method = (settings.http_method || "POST").toUpperCase();
  const reqBody = method === "GET" ? undefined : JSON.stringify(applyPlaceholders(settings.request_template || {}, vars));
  const res = await fetch(endpoint, { method, headers, body: reqBody });
  const text = await res.text();
  const ok = res.ok && (!settings.success_keyword || text.toLowerCase().includes(String(settings.success_keyword).toLowerCase()));
  let provider_message_id: string | null = null;
  try {
    const j = JSON.parse(text);
    provider_message_id = j?.messages?.[0]?.id || j?.id || j?.message_id || null;
  } catch { /* ignore */ }
  return { ok, text, provider_message_id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await requireAdmin(req);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { action, name, body, media_url, audience_filter, to, template_key } = await req.json();

    const { data: settings } = await sb.from("wa_provider_settings").select("*").maybeSingle();
    if (!settings || !settings.enabled) return json({ error: "WhatsApp provider not configured/enabled" }, 400);

    if (action === "single") {
      if (!to || !body) return json({ error: "to + body required" }, 400);
      const phone = normPhone(to);
      const { data: sup } = await sb.from("wa_suppression").select("phone").eq("phone", phone).maybeSingle();
      if (sup) {
        await sb.from("wa_messages").insert({ to_phone: phone, body, status: "suppressed", template_key: template_key || null });
        return json({ sent: 0, failed: 0, suppressed: 1 });
      }
      const r = await sendOne(settings, phone, body, media_url || "");
      await sb.from("wa_messages").insert({
        to_phone: phone, body, template_key: template_key || null,
        status: r.ok ? "sent" : "failed",
        provider_message_id: r.provider_message_id,
        error: r.ok ? null : r.text.slice(0, 500),
      });
      return json({ sent: r.ok ? 1 : 0, failed: r.ok ? 0 : 1 });
    }

    if (action === "bulk") {
      if (!body) return json({ error: "body required" }, 400);
      const recipients = await resolveAudience(sb, audience_filter || { type: "all" });
      if (!recipients.length) return json({ error: "No recipients matched" }, 400);

      const phones = recipients.map((r) => r.phone);
      const { data: suppressed } = await sb.from("wa_suppression").select("phone").in("phone", phones);
      const suppressedSet = new Set((suppressed || []).map((s: any) => s.phone));
      const valid = recipients.filter((r) => !suppressedSet.has(r.phone));

      const { data: campaign } = await sb.from("wa_campaigns").insert({
        name: name || `Campaign ${new Date().toISOString().slice(0, 16)}`,
        body_snapshot: body,
        media_url: media_url || "",
        recipient_count: valid.length,
        status: "sending",
        audience_filter: audience_filter || { type: "all" },
      }).select().single();

      let sent = 0, failed = 0;
      for (const r of valid) {
        try {
          const personalised = body.replace(/\{name\}/g, r.name || "");
          const res = await sendOne(settings, r.phone, personalised, media_url || "");
          if (res.ok) sent++; else failed++;
          await sb.from("wa_messages").insert({
            campaign_id: campaign?.id,
            to_phone: r.phone,
            body: personalised,
            status: res.ok ? "sent" : "failed",
            provider_message_id: res.provider_message_id,
            error: res.ok ? null : res.text.slice(0, 500),
          });
        } catch (e: any) {
          failed++;
          await sb.from("wa_messages").insert({
            campaign_id: campaign?.id, to_phone: r.phone, body, status: "failed",
            error: String(e?.message || e).slice(0, 500),
          });
        }
      }

      await sb.from("wa_campaigns").update({ sent_count: sent, failed_count: failed, status: "sent" }).eq("id", campaign!.id);
      return json({ sent, failed, suppressed: suppressedSet.size, campaign_id: campaign?.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
