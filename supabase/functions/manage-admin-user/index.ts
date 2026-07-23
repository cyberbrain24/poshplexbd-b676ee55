import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const usernameToEmail = (u: string) => `${u.toLowerCase().trim()}@admin.local`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  const corsH = getCorsHeaders(req);
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsH, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // Only super-admin can manage admin users
    if (user.email !== "poshplexbd@gmail.com") {
      return json({ error: "Forbidden: super-admin only" }, 403);
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { username, password, modules } = body;
      if (!username || !password || password.length < 6) {
        return json({ error: "username and password (min 6) required" }, 400);
      }
      const email = usernameToEmail(username);
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { username, admin_username: true },
      });
      if (cErr || !created.user) return json({ error: cErr?.message || "create failed" }, 400);

      const uid = created.user.id;
      await admin.from("user_roles").insert({ user_id: uid, role: "admin" });
      const { error: pErr } = await admin.from("admin_permissions").insert({
        user_id: uid, username: username.toLowerCase().trim(),
        modules: Array.isArray(modules) ? modules : [],
      });
      if (pErr) {
        await admin.auth.admin.deleteUser(uid);
        return json({ error: pErr.message }, 400);
      }
      return json({ ok: true, user_id: uid });
    }

    if (action === "update_modules") {
      const { user_id, modules, is_active } = body;
      const patch: Record<string, unknown> = {};
      if (Array.isArray(modules)) patch.modules = modules;
      if (typeof is_active === "boolean") patch.is_active = is_active;
      const { error } = await admin.from("admin_permissions").update(patch).eq("user_id", user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "update_password") {
      const { user_id, password } = body;
      if (!password || password.length < 6) return json({ error: "password min 6" }, 400);
      const { error } = await admin.auth.admin.updateUserById(user_id, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "delete") {
      const { user_id } = body;
      await admin.from("user_roles").delete().eq("user_id", user_id);
      await admin.from("admin_permissions").delete().eq("user_id", user_id);
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
