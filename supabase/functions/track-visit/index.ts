import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BOT_RE = /bot|crawler|spider|preview|monitor|facebookexternalhit|whatsapp|slurp|bingpreview|headless|lighthouse|pingdom|gtmetrix/i;

function detectDevice(ua: string): string {
  if (!ua) return 'unknown';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function extractIp(req: Request): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || null;
}

async function lookupGeo(ip: string) {
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`);
    const d = await r.json();
    if (d.status !== 'success') return null;
    return {
      country: d.country || null,
      country_code: d.countryCode || null,
      region: d.regionName || null,
      city: d.city || null,
      lat: d.lat || null,
      lon: d.lon || null,
      isp: d.isp || null,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { path, referrer, session_id, customer_id } = await req.json();
    if (!path || typeof path !== 'string') {
      return new Response(JSON.stringify({ error: 'path required' }), { status: 400, headers: corsHeaders });
    }
    if (path.startsWith('/admin')) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const ua = req.headers.get('user-agent') || '';
    if (BOT_RE.test(ua)) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const ip = extractIp(req);
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let geo: any = null;
    if (ip) {
      const { data: cached } = await supabase
        .from('ip_geo_cache')
        .select('country, country_code, region, city')
        .eq('ip_address', ip)
        .maybeSingle();

      if (cached) {
        geo = cached;
      } else {
        const fresh = await lookupGeo(ip);
        if (fresh) {
          geo = fresh;
          await supabase.from('ip_geo_cache').upsert({ ip_address: ip, ...fresh });
        }
      }
    }

    await supabase.from('page_views').insert({
      path: path.slice(0, 500),
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      user_agent: ua.slice(0, 500),
      device_type: detectDevice(ua),
      ip_address: ip,
      country: geo?.country || null,
      country_code: geo?.country_code || null,
      region: geo?.region || null,
      city: geo?.city || null,
      session_id: session_id ? String(session_id).slice(0, 100) : null,
      customer_id: customer_id || null,
    });

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (e) {
    console.error('track-visit error', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
