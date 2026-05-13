// Unified AI chat completions helper.
// Uses ONLY third-party AI providers (Gemini / OpenAI / Anthropic / OpenRouter).
// Keys are loaded from `site_settings` (DB) first, then env fallback.
// Each provider also has an enable toggle in `site_settings`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_OAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

type Provider = "gemini" | "openai" | "anthropic" | "openrouter";

type ProviderState = {
  gemini: { key: string | null; enabled: boolean };
  openai: { key: string | null; enabled: boolean };
  anthropic: { key: string | null; enabled: boolean };
  openrouter: { key: string | null; enabled: boolean };
};

let cached: { state: ProviderState; at: number } | null = null;
const TTL_MS = 30_000;

export async function loadProviderState(): Promise<ProviderState> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.state;

  const state: ProviderState = {
    gemini: { key: Deno.env.get("GEMINI_API_KEY") || null, enabled: true },
    openai: { key: Deno.env.get("OPENAI_API_KEY") || null, enabled: true },
    anthropic: { key: Deno.env.get("ANTHROPIC_API_KEY") || null, enabled: true },
    openrouter: { key: Deno.env.get("OPENROUTER_API_KEY") || null, enabled: true },
  };

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const srk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && srk) {
      const sb = createClient(url, srk);
      const { data } = await sb
        .from("site_settings")
        .select(
          "gemini_api_key, gemini_enabled, openai_api_key, openai_enabled, anthropic_api_key, anthropic_enabled, openrouter_api_key, openrouter_enabled",
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
        if (data.openrouter_api_key) state.openrouter.key = data.openrouter_api_key as string;
        if (data.openrouter_enabled === false) state.openrouter.enabled = false;
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
  if (model.startsWith("openrouter/")) return "openrouter";
  if (model.startsWith("google/") || model.startsWith("gemini")) return "gemini";
  if (model.startsWith("openai/") || model.startsWith("gpt-")) return "openai";
  if (model.startsWith("anthropic/") || model.startsWith("claude")) return "anthropic";
  return null;
}

function pickFirstAvailable(state: ProviderState): Provider | null {
  if (state.gemini.enabled && state.gemini.key) return "gemini";
  if (state.openai.enabled && state.openai.key) return "openai";
  if (state.anthropic.enabled && state.anthropic.key) return "anthropic";
  if (state.openrouter.enabled && state.openrouter.key) return "openrouter";
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

function mapModelForOpenRouter(model?: string): string {
  // OpenRouter accepts identifiers like "openai/gpt-4o-mini", "google/gemini-2.5-flash",
  // "anthropic/claude-3-5-sonnet". Pass through, normalising bare names to a vendor prefix.
  if (!model) return "google/gemini-2.5-flash";
  let m = model.replace(/^openrouter\//, "");
  if (m.includes("/")) return m;
  if (m.startsWith("gemini")) return `google/${m}`;
  if (m.startsWith("gpt-")) return `openai/${m}`;
  if (m.startsWith("claude")) return `anthropic/${m}`;
  return m;
}

async function callProvider(provider: Provider, state: ProviderState, body: any): Promise<Response> {
  if (provider === "gemini") {
    const payload = { ...body, model: mapModelForGemini(body.model) };
    return fetch(GEMINI_OAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.gemini.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  if (provider === "openai") {
    const payload = { ...body, model: mapModelForOpenAI(body.model) };
    return fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.openai.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  if (provider === "openrouter") {
    // OpenRouter requires an explicit max_tokens; without it, the upstream model
    // reserves its full context window and small-credit keys get a 402.
    const payload = {
      ...body,
      model: mapModelForOpenRouter(body.model),
      max_tokens: typeof body.max_tokens === "number" ? Math.min(body.max_tokens, 4096) : 2048,
    };
    return fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.openrouter.key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": Deno.env.get("SUPABASE_URL") || "https://poshplexbd.com",
        "X-Title": "POSHPLEX",
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

function shouldFailover(status: number): boolean {
  return status === 429 || status === 408 || status === 503 || status === 502 || status === 504 || status === 500;
}

export async function aiChatCompletion(body: any, _opts: { stream?: boolean } = {}): Promise<Response> {
  const state = await loadProviderState();

  const requested = providerForModel(body?.model);
  const order: Provider[] = [];
  if (requested && isUsable(state, requested)) order.push(requested);
  for (const p of ["gemini", "openai", "anthropic", "openrouter"] as Provider[]) {
    if (!order.includes(p) && isUsable(state, p)) order.push(p);
  }

  if (order.length === 0) {
    return new Response(
      JSON.stringify({
        error:
          "No AI provider configured or enabled. Add a key for Gemini, OpenAI, Anthropic, or OpenRouter in Admin → Site Settings → AI Credentials.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let lastResp: Response | null = null;
  for (let i = 0; i < order.length; i++) {
    const provider = order[i];
    try {
      const resp = await callProvider(provider, state, body);
      if (resp.ok) return resp;
      if (!shouldFailover(resp.status) || i === order.length - 1) {
        return resp;
      }
      try { await resp.text(); } catch { /* ignore */ }
      console.warn(`AI provider ${provider} returned ${resp.status}, failing over...`);
      lastResp = resp;
    } catch (e) {
      console.error(`AI provider ${provider} threw:`, e);
      if (i === order.length - 1) {
        return new Response(JSON.stringify({ error: (e as Error).message }), {
          status: 502, headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
  return lastResp || new Response(JSON.stringify({ error: "AI unavailable" }), {
    status: 503, headers: { "Content-Type": "application/json" },
  });
}
