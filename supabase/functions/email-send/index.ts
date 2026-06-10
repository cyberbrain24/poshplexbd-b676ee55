// Generic email send endpoint - admin only. Mirrors sms-send pattern.
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
  if (typeof input === "string") {
    return input.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  }
  if (Array.isArray(input)) return input.map((v) => applyPlaceholders(v, vars));
  if (input && typeof input === "object") {
    const out: any = {};
    for (const k of Object.keys(input)) out[k] = applyPlaceholders(input[k], vars);
    return out;
  }
  return input;
}

async function resolveAudience(sb: any, filter: any): Promise<{ email: string; name?: string }[]> {
  const type = filter?.type || "all";
  if (type === "manual") {
    const emails: string[] = Array.isArray(filter.emails) ? filter.emails : [];
    return emails.map((e) => String(e || "").trim()).filter(Boolean).map((email) => ({ email }));
  }
  let q = sb.from("customers").select("id, name, email").not("email", "is", null).eq("is_active", true);
  if (type === "membership" && Array.isArray(filter.ids) && filter.ids.length) q = q.in("customer_type_id", filter.ids);
  else if (type === "division" && Array.isArray(filter.ids) && filter.ids.length) q = q.in("division_id", filter.ids);
  const { data } = await q.limit(10000);
  return (data || []).filter((c: any) => c.email).map((c: any) => ({ email: c.email, name: c.name }));
}

function unsubFooter(siteUrl: string, email: string) {
  const token = btoa(email).replace(/=+$/, "");
  const url = `${siteUrl}/email/unsubscribe?e=${encodeURIComponent(token)}`;
  return `<hr style="margin-top:24px;border:none;border-top:1px solid #eee"/><p style="font-size:11px;color:#888;text-align:center;margin-top:12px">You received this from POSHPLEX. <a href="${url}" style="color:#888">Unsubscribe</a></p>`;
}

async function sendOne(settings: any, to: string, name: string, subject: string, html: string, siteUrl: string) {
  const fullHtml = html + unsubFooter(siteUrl, to);
  const vars: Record<string, string> = {
    api_key: settings.api_key || "",
    from_email: settings.from_email || "",
    from_name: settings.from_name || "POSHPLEX",
    reply_to: settings.reply_to || "",
    to,
    name: name || "",
    subject,
    html: fullHtml,
    text: fullHtml.replace(/<[^>]+>/g, ""),
  };
  const endpoint = applyPlaceholders(settings.endpoint_url || "", vars);
  const headers = applyPlaceholders(settings.headers || {}, vars);
  const method = (settings.http_method || "POST").toUpperCase();
  const body = method === "GET" ? undefined : JSON.stringify(applyPlaceholders(settings.request_template || {}, vars));
  const res = await fetch(endpoint, { method, headers, body });
  const text = await res.text();
  const ok = res.ok && (!settings.success_keyword || text.toLowerCase().includes(String(settings.success_keyword).toLowerCase()));
  return { ok, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const user = await requireAdmin(req);
    if (!user) return json({ error: "Unauthorized" }, 401);
    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { action, name, subject, html, audience_filter, to, site_url } = await req.json();

    const { data: settings } = await sb.from("email_provider_settings").select("*").maybeSingle();
    if (!settings || !settings.enabled) return json({ error: "Email provider not configured/enabled" }, 400);
    if (!settings.from_email) return json({ error: "Set a From email in Provider Settings" }, 400);

    const siteUrl = site_url || req.headers.get("origin") || "https://poshplexbd.com";

    if (action === "single") {
      if (!to || !subject) return json({ error: "to + subject required" }, 400);
      // suppression check
      const { data: sup } = await sb.from("email_suppression").select("email").eq("email", to).maybeSingle();
      if (sup) {
        await sb.from("email_messages").insert({ to_email: to, subject, status: "suppressed" });
        return json({ sent: 0, failed: 0, suppressed: 1 });
      }
      const r = await sendOne(settings, to, "", subject, html || "", siteUrl);
      await sb.from("email_messages").insert({ to_email: to, subject, status: r.ok ? "sent" : "failed", error: r.ok ? null : r.text.slice(0, 500) });
      return json({ sent: r.ok ? 1 : 0, failed: r.ok ? 0 : 1 });
    }

    if (action === "bulk") {
      if (!subject || !html) return json({ error: "subject + html required" }, 400);
      const recipients = await resolveAudience(sb, audience_filter || { type: "all" });
      if (!recipients.length) return json({ error: "No recipients matched" }, 400);

      const emails = recipients.map((r) => r.email);
      const { data: suppressed } = await sb.from("email_suppression").select("email").in("email", emails);
      const suppressedSet = new Set((suppressed || []).map((s: any) => s.email));
      const valid = recipients.filter((r) => !suppressedSet.has(r.email));

      const { data: campaign } = await sb.from("email_campaigns").insert({
        name: name || subject,
        subject,
        recipient_count: valid.length,
        status: "sending",
        audience_filter: audience_filter || { type: "all" },
      }).select().single();

      let sent = 0, failed = 0;
      for (const r of valid) {
        try {
          const personalised = html.replace(/\{name\}/g, r.name || "");
          const res = await sendOne(settings, r.email, r.name || "", subject, personalised, siteUrl);
          if (res.ok) sent++; else failed++;
          await sb.from("email_messages").insert({
            campaign_id: campaign?.id,
            to_email: r.email,
            subject,
            status: res.ok ? "sent" : "failed",
            error: res.ok ? null : res.text.slice(0, 500),
          });
        } catch (e: any) {
          failed++;
          await sb.from("email_messages").insert({ campaign_id: campaign?.id, to_email: r.email, subject, status: "failed", error: String(e?.message || e).slice(0, 500) });
        }
      }

      await sb.from("email_campaigns").update({ sent_count: sent, failed_count: failed, status: "sent" }).eq("id", campaign!.id);
      return json({ sent, failed, suppressed: suppressedSet.size, campaign_id: campaign?.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, 500);
  }
});
