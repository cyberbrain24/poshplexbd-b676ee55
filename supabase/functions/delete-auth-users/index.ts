import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  const corsH = getCorsHeaders(req);

  // Verify caller is admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("Unauthorized", { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return new Response("Unauthorized", { status: 401 });

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return new Response("Forbidden", { status: 403 });

  const { userIds } = await req.json();
  if (!userIds || !Array.isArray(userIds)) {
    return new Response(JSON.stringify({ error: "userIds array required" }), { status: 400, headers: { ...corsH, "Content-Type": "application/json" } });
  }

  const results = [];
  for (const uid of userIds) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(uid);
    results.push({ uid, success: !error, error: error?.message });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsH, "Content-Type": "application/json" },
  });
});
