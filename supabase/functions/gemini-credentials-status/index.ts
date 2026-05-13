// Returns AI provider configuration status (Gemini / OpenAI / Anthropic). Admin-only.
// Function name kept as `gemini-credentials-status` for backward compatibility.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mask(k: string | null | undefined): string | null {
  if (!k) return null;
  if (k.length <= 8) return "••••";
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select(
        "gemini_api_key, gemini_enabled, openai_api_key, openai_enabled, anthropic_api_key, anthropic_enabled, openrouter_api_key, openrouter_enabled",
      )
      .limit(1)
      .maybeSingle();

    const buildStatus = (envName: string, dbKey: string | null, enabled: boolean) => {
      const envKey = Deno.env.get(envName) || null;
      const active = dbKey || envKey;
      return {
        configured: !!active,
        enabled,
        masked: mask(active),
        source: dbKey ? "database" : envKey ? "secret" : null,
      };
    };

    const gemini = buildStatus(
      "GEMINI_API_KEY",
      (settings?.gemini_api_key as string) || null,
      settings?.gemini_enabled !== false,
    );
    const openai = buildStatus(
      "OPENAI_API_KEY",
      (settings?.openai_api_key as string) || null,
      settings?.openai_enabled !== false,
    );
    const anthropic = buildStatus(
      "ANTHROPIC_API_KEY",
      (settings?.anthropic_api_key as string) || null,
      settings?.anthropic_enabled !== false,
    );
    const openrouter = buildStatus(
      "OPENROUTER_API_KEY",
      (settings?.openrouter_api_key as string) || null,
      settings?.openrouter_enabled !== false,
    );

    let activeProvider = "none";
    if (gemini.enabled && gemini.configured) activeProvider = "gemini";
    else if (openai.enabled && openai.configured) activeProvider = "openai";
    else if (anthropic.enabled && anthropic.configured) activeProvider = "anthropic";
    else if (openrouter.enabled && openrouter.configured) activeProvider = "openrouter";

    return new Response(
      JSON.stringify({
        gemini_configured: gemini.configured,
        gemini_enabled: gemini.enabled,
        gemini_masked: gemini.masked,
        gemini_source: gemini.source,
        active_provider: activeProvider,
        providers: { gemini, openai, anthropic, openrouter },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
