import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * Meta Conversions API (CAPI) Edge Function
 * Receives event data from the client, hashes PII, and forwards to Meta's Graph API.
 * Provides server-side event tracking that bypasses ad blockers / iOS restrictions.
 * Events are deduplicated with the browser Pixel via shared event_id.
 */

interface UserData {
  em?: string;       // email
  ph?: string;       // phone digits
  fn?: string;       // first name
  ln?: string;       // last name
  ct?: string;       // city
  country?: string;
  external_id?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;      // _fbp cookie
  fbc?: string;      // _fbc cookie
}

interface CapiEventPayload {
  event_name: string;
  event_id: string;
  event_time?: number; // unix seconds from browser; preferred for dedup
  event_source_url?: string;
  user_data?: UserData;
  custom_data?: Record<string, unknown>;
  action_source?: 'website' | 'email' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
}

// SHA-256 hex hash (Meta requires lowercased & trimmed before hashing)
async function sha256Hex(input: string): Promise<string> {
  const normalized = input.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Strict RFC-5322-ish email check + reject internal shadow domains so we
// never send invalid/placeholder addresses to Meta.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (raw: string): boolean => {
  const e = raw.trim().toLowerCase();
  if (!e || !EMAIL_RE.test(e)) return false;
  if (e.endsWith('@phone.local')) return false;       // POSHPLEX shadow account
  if (e.endsWith('@example.com')) return false;
  if (e.endsWith('@example.org')) return false;
  if (e.endsWith('@test.com')) return false;
  return true;
};

// Phones must be E.164 digits only (no "+"), 10-15 chars per Meta spec.
// Bangladesh local numbers ("01XXXXXXXXX") get normalized to "8801XXXXXXXXX".
const normalizePhoneE164 = (raw: string): string | null => {
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('01')) digits = '880' + digits.slice(1);
  else if (digits.length === 10 && digits.startsWith('1')) digits = '880' + digits;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
};

async function hashUserData(u: UserData) {
  const out: Record<string, string | string[]> = {};

  if (u.em && isValidEmail(u.em)) {
    out.em = await sha256Hex(u.em);
  }
  if (u.ph) {
    const normalized = normalizePhoneE164(u.ph);
    if (normalized) out.ph = await sha256Hex(normalized);
  }
  if (u.fn && u.fn.trim()) out.fn = await sha256Hex(u.fn);
  if (u.ln && u.ln.trim()) out.ln = await sha256Hex(u.ln);
  if (u.ct && u.ct.trim()) out.ct = await sha256Hex(u.ct);
  if (u.country && u.country.trim()) out.country = await sha256Hex(u.country);
  if (u.external_id && u.external_id.trim()) out.external_id = await sha256Hex(u.external_id);

  // These are NOT hashed
  if (u.client_ip_address) out.client_ip_address = u.client_ip_address;
  if (u.client_user_agent) out.client_user_agent = u.client_user_agent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as CapiEventPayload;

    // Basic validation
    if (!body?.event_name || typeof body.event_name !== 'string') {
      return new Response(JSON.stringify({ error: 'event_name required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!body?.event_id || typeof body.event_id !== 'string') {
      return new Response(JSON.stringify({ error: 'event_id required for deduplication' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fetch pixel settings + CAPI access token from site_settings
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: settings, error: settingsErr } = await admin
      .from('site_settings')
      .select('meta_pixel_id, meta_pixel_enabled, meta_capi_enabled, meta_test_mode, meta_capi_access_token')
      .limit(1)
      .maybeSingle();

    if (settingsErr || !settings) {
      return new Response(JSON.stringify({ error: 'Failed to load pixel settings' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.meta_pixel_enabled || !settings.meta_capi_enabled || !settings.meta_pixel_id) {
      return new Response(JSON.stringify({ skipped: true, reason: 'CAPI disabled' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prefer DB-managed token (set from admin UI); fall back to env var for legacy setups
    const ACCESS_TOKEN = (settings as any).meta_capi_access_token || Deno.env.get('META_CAPI_ACCESS_TOKEN');
    if (!ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: 'CAPI access token not configured in admin' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-collect client IP + UA if not provided
    const userData: UserData = { ...(body.user_data || {}) };
    if (!userData.client_ip_address) {
      const xff = req.headers.get('x-forwarded-for') || '';
      const ip = xff.split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
      if (ip) userData.client_ip_address = ip;
    }
    if (!userData.client_user_agent) {
      const ua = req.headers.get('user-agent');
      if (ua) userData.client_user_agent = ua;
    }

    const hashedUser = await hashUserData(userData);

    const eventPayload: Record<string, unknown> = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      action_source: body.action_source || 'website',
      event_source_url: body.event_source_url,
      user_data: hashedUser,
    };
    if (body.custom_data && Object.keys(body.custom_data).length > 0) {
      // Server-side safety net: enforce Meta's "value must be > 0" rule.
      // If value is missing/zero/invalid, drop value+currency entirely.
      const customData: Record<string, unknown> = { ...body.custom_data };
      const v = Number(customData.value);
      if (!Number.isFinite(v) || v <= 0) {
        delete customData.value;
        delete customData.currency;
      } else {
        customData.value = Math.round(v * 100) / 100;
      }
      if (Object.keys(customData).length > 0) {
        eventPayload.custom_data = customData;
      }
    }

    const fbBody: Record<string, unknown> = {
      data: [eventPayload],
      access_token: ACCESS_TOKEN,
    };
    if (settings.meta_test_mode) {
      fbBody.test_event_code = 'TEST12345';
    }

    const fbUrl = `https://graph.facebook.com/v18.0/${settings.meta_pixel_id}/events`;
    const fbRes = await fetch(fbUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fbBody),
    });

    const fbData = await fbRes.json();

    if (!fbRes.ok) {
      console.error('[Meta CAPI] Error:', fbData);
      return new Response(JSON.stringify({ error: 'Meta API error', details: fbData }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, meta: fbData }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Meta CAPI] Exception:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
