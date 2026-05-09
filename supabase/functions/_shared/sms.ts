// Shared SMS sender used by transactional + bulk + AI flows.
// Uses sms_provider_settings (single row) to call any HTTP SMS gateway.

export type SmsContext = Record<string, string | number | undefined | null>;

export function renderTemplate(tpl: string, ctx: SmsContext): string {
  return (tpl || "").replace(/\{(\w+)\}/g, (_, k) => {
    const v = ctx[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

function deepRender(value: any, ctx: SmsContext): any {
  if (typeof value === "string") return renderTemplate(value, ctx);
  if (Array.isArray(value)) return value.map(v => deepRender(v, ctx));
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepRender(v, ctx);
    return out;
  }
  return value;
}

export interface SendResult {
  success: boolean;
  status: "sent" | "failed";
  response: string;
}

export async function sendSmsViaProvider(
  sb: any,
  phone: string,
  message: string,
): Promise<SendResult> {
  const { data: settings } = await sb
    .from("sms_provider_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!settings || !settings.enabled) {
    return { success: false, status: "failed", response: "SMS provider disabled" };
  }
  if (!settings.endpoint_url) {
    return { success: false, status: "failed", response: "SMS endpoint URL not configured" };
  }

  const ctx: SmsContext = {
    phone,
    message,
    api_key: settings.api_key || "",
    sender_id: settings.sender_id || "",
  };

  const url = renderTemplate(settings.endpoint_url, ctx);
  const headers = deepRender(settings.headers || {}, ctx);
  const method = (settings.http_method || "POST").toUpperCase();

  try {
    let resp: Response;
    if (method === "GET") {
      resp = await fetch(url, { method, headers });
    } else {
      const bodyTpl = settings.request_template || {};
      const body = deepRender(bodyTpl, ctx);
      const isJson = (headers["Content-Type"] || headers["content-type"] || "").includes("json");
      resp = await fetch(url, {
        method,
        headers,
        body: isJson ? JSON.stringify(body) : new URLSearchParams(body as any).toString(),
      });
    }
    const text = await resp.text();
    const okKeyword = (settings.success_keyword || "").toLowerCase();
    const success = resp.ok && (!okKeyword || text.toLowerCase().includes(okKeyword));
    return {
      success,
      status: success ? "sent" : "failed",
      response: text.slice(0, 500),
    };
  } catch (e: any) {
    return { success: false, status: "failed", response: e?.message || "Network error" };
  }
}

export async function logAndSend(
  sb: any,
  opts: {
    phone: string;
    body: string;
    customer_id?: string | null;
    order_id?: string | null;
    template_id?: string | null;
    campaign_id?: string | null;
    trigger_event?: string | null;
  }
): Promise<SendResult> {
  const result = await sendSmsViaProvider(sb, opts.phone, opts.body);
  await sb.from("sms_messages").insert({
    phone: opts.phone,
    body: opts.body,
    status: result.status,
    provider_response: result.response,
    customer_id: opts.customer_id || null,
    order_id: opts.order_id || null,
    template_id: opts.template_id || null,
    campaign_id: opts.campaign_id || null,
    trigger_event: opts.trigger_event || null,
    sent_at: result.success ? new Date().toISOString() : null,
  });
  return result;
}

export async function sendByEvent(
  sb: any,
  event_key: string,
  phone: string,
  ctx: SmsContext,
  refs: { customer_id?: string | null; order_id?: string | null } = {}
) {
  const { data: tpl } = await sb
    .from("sms_templates")
    .select("*")
    .eq("event_key", event_key)
    .maybeSingle();
  if (!tpl || !tpl.enabled) return { skipped: true, reason: "Template not enabled" };
  const body = renderTemplate(tpl.body, ctx);
  return await logAndSend(sb, {
    phone,
    body,
    template_id: tpl.id,
    trigger_event: event_key,
    ...refs,
  });
}
