import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}

export function requireAdminKey(api_key: string | undefined): { content: { type: "text"; text: string }[]; isError: true } | null {
  const expected = import.meta.env.VITE_MCP_ADMIN_KEY;
  if (!expected) {
    return { content: [{ type: "text", text: "Server misconfigured: MCP_ADMIN_KEY not set" }], isError: true };
  }
  if (!api_key || api_key !== expected) {
    return { content: [{ type: "text", text: "Unauthorized: invalid or missing api_key" }], isError: true };
  }
  return null;
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
