import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}

export function requireAdminKey(api_key: string | undefined): { ok: true } | { ok: false; error: any } {
  const expected = process.env.MCP_ADMIN_KEY;
  if (!expected) {
    return { ok: false, error: { content: [{ type: "text", text: "Server misconfigured: MCP_ADMIN_KEY not set" }], isError: true } };
  }
  if (!api_key || api_key !== expected) {
    return { ok: false, error: { content: [{ type: "text", text: "Unauthorized: invalid or missing api_key" }], isError: true } };
  }
  return { ok: true };
}

export function applyFilters(query: any, filters?: Record<string, unknown>) {
  if (!filters) return query;
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v)) query = query.in(k, v);
    else if (v === null) query = query.is(k, null);
    else query = query.eq(k, v);
  }
  return query;
}
