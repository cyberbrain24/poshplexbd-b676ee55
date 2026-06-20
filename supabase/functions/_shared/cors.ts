/**
 * CORS configuration for edge functions
 * Restricts to production domain and localhost dev
 */

const ALLOWED_ORIGINS = [
  "https://poshplexbd.com",
  "https://www.poshplexbd.com",
  "https://id-preview--e6beb355-f51f-4a8a-bf08-33a1a11b94e1.lovable.app",
  "https://e6beb355-f51f-4a8a-bf08-33a1a11b94e1.lovableproject.com",
  "https://dev.poshplexbd.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";

  const isAllowed =
    ALLOWED_ORIGINS.includes(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsOptions(req: Request): Response {
  return new Response(null, { headers: getCorsHeaders(req) });
}
