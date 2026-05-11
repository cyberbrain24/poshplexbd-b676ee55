// Unified AI chat completions helper.
// Uses ONLY third-party AI providers (Gemini / OpenAI / Anthropic).
// Keys are loaded from `site_settings` (DB) first, then env fallback.
// Each provider also has an enable toggle in `site_settings`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_OAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

type Provider = "gemini" | "openai" | "anthropic";

type ProviderState = {
  gemini: { key: string | null; enabled: boolean };
  openai: { key: string | null; enabled: boolean };
  anthropic: { key: string | null; enabled: boolean };
};

let cached: { state: ProviderState; at: number } | null = null;
const TTL_MS = 30_000;

export async function loadProviderState(): Promise<ProviderState> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.state;

  const state: ProviderState = {
    gemini: { key: Deno.env.get("GEMINI_API_KEY") || null, enabled: true },
    openai: { key: Deno.env.get("OPENAI_API_KEY") || null, enabled: true },
    anthropic: { key: Deno.env.get("ANTHROPIC_API_KEY") || null, enabled: true },
  };

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && srk) {
      const sb = createClient(url, srk);
      const { data } = await sb
        .from("site_settings")
        .select(
          "gemini_api_key, gemini_enabled, openai_api_key, openai_enabled, anthropic_api_key, anthropic_enabled",
        )
        .limit(1)
        .maybeSingle();
      if (data) {
        if (data.gemini_api_key) state.gemini.key = data.gemini_api_key as string;
        if (data.gemini_enabled === false) state.gemini.enabled = false;
        if (data.openai_api_key) state.openai.key = data.openai_api_key as string;
        if (data.openai_enabled === false) state.openai.enabled = false;
        if (data.anthropic_api_key) state.anthropic.key = data.anthropic_api_key as string;
        if (data.anthropic_enabled === false) state.anthropic.enabled = false;
      }
    }
  } catch (e) {
    console.error("loadProviderState error:", e);
  }

  cached = { state, at: Date.now() };
  return state;
}

function providerForModel(model?: string): Provider | null {
  if (!model) return null;
  if (model.startsWith("google/") || model.startsWith("gemini")) return "gemini";
  if (model.startsWith("openai/") || model.startsWith("gpt-")) return "openai";
  if (model.startsWith("anthropic/") || model.startsWith("claude")) return "anthropic";
  return null;
}

function pickFirstAvailable(state: ProviderState): Provider | null {
  if (state.gemini.enabled && state.gemini.key) return "gemini";
  if (state.openai.enabled && state.openai.key) return "openai";
  if (state.anthropic.enabled && state.anthropic.key) return "anthropic";
  return null;
}

function isUsable(state: ProviderState, p: Provider): boolean {
  return state[p].enabled && !!state[p].key;
}

export async function aiProvider(): Promise<Provider | null> {
  const state = await loadProviderState();
  return pickFirstAvailable(state);
}

function mapModelForGemini(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  let m = model.replace(/^google\//, "").replace(/^openai\//, "").replace(/^anthropic\//, "");
  m = m.replace(/-preview$/, "");
  if (m.startsWith("gpt-") || m.startsWith("claude")) m = "gemini-2.5-flash";
  if (m === "gemini-3-flash") m = "gemini-2.5-flash";
  if (m === "gemini-3.1-pro") m = "gemini-2.5-pro";
  if (m === "gemini-3-pro-image") m = "gemini-2.5-flash-image";
  return m;
}

function mapModelForOpenAI(model?: string): string {
  if (!model) return "gpt-4o-mini";
  let m = model.replace(/^openai\//, "").replace(/^google\//, "").replace(/^anthropic\//, "");
  if (m.startsWith("gemini") || m.startsWith("claude")) m = "gpt-4o-mini";
  return m;
}

function mapModelForAnthropic(model?: string): string {
  if (!model) return "claude-3-5-sonnet-latest";
  let m = model.replace(/^anthropic\//, "").replace(/^google\//, "").replace(/^openai\//, "");
  if (m.startsWith("gemini") || m.startsWith("gpt-")) m = "claude-3-5-sonnet-latest";
  return m;
}

export async function aiChatCompletion(body: any, _opts: { stream?: boolean } = {}): Promise<Response> {
  const state = await loadProviderState();

  const requested = providerForModel(body?.model);
  let provider: Provider | null = requested && isUsable(state, requested) ? requested : null;
  if (!provider) provider = pickFirstAvailable(state);

  if (!provider) {
    return new Response(
      JSON.stringify({
        error:
          "No AI provider configured or enabled. Add a key for Gemini, OpenAI, or Anthropic in Admin → Site Settings → AI Credentials.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (provider === "gemini") {
    const payload = { ...body, model: mapModelForGemini(body.model) };
    return fetch(GEMINI_OAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.gemini.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (provider === "openai") {
    const payload = { ...body, model: mapModelForOpenAI(body.model) };
    return fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.openai.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  // Anthropic
  const messages = (body.messages || []).filter((m: any) => m.role !== "system");
  const system = (body.messages || []).find((m: any) => m.role === "system")?.content;
  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": state.anthropic.key!,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: mapModelForAnthropic(body.model),
      max_tokens: 4096,
      system,
      messages,
    }),
  });
  if (!resp.ok) return resp;
  const data = await resp.json();
  const text = (data.content || []).map((c: any) => c.text || "").join("");
  const oaiShape = {
    choices: [{ message: { role: "assistant", content: text }, finish_reason: data.stop_reason || "stop" }],
  };
  return new Response(JSON.stringify(oaiShape), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
