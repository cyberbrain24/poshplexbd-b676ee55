import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  const corsH = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsH, "Content-Type": "application/json" },
    });

  try {
    // Require an authenticated admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) return json({ error: "Forbidden" }, 403);

    const { email, newPassword } = await req.json();
    if (!email || typeof email !== "string" || !newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return json({ error: "Invalid input" }, 400);
    }

    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const target = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!target) return json({ error: "User not found" }, 404);

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password: newPassword });
    if (updErr) throw updErr;

    return json({ success: true });
  } catch (e) {
    console.error("admin-reset-password error:", e);
    return json({ error: "Internal error" }, 500);
  }
});
