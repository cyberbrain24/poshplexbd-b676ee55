// Unified AI chat completions helper.
// Uses ONLY third-party AI providers (Gemini / OpenAI / Anthropic).
// Routing precedence:
//   1. If body.model has a recognized prefix (`google/`, `openai/`, `anthropic/`),
//      route to that provider — provided its API key is set.
//   2. Otherwise fall back to the first available provider in the order:
//      Gemini → OpenAI → Anthropic.

const GEMINI_OAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

type Provider = "gemini" | "openai" | "anthropic";

export function aiProvider(): Provider | null {
  if (Deno.env.get("GEMINI_API_KEY")) return "gemini";
  if (Deno.env.get("OPENAI_API_KEY")) return "openai";
  if (Deno.env.get("ANTHROPIC_API_KEY")) return "anthropic";
  return null;
}

function providerForModel(model?: string): Provider | null {
  if (!model) return null;
  if (model.startsWith("google/") || model.startsWith("gemini")) return "gemini";
  if (model.startsWith("openai/") || model.startsWith("gpt-")) return "openai";
  if (model.startsWith("anthropic/") || model.startsWith("claude")) return "anthropic";
  return null;
}

function hasKey(p: Provider): boolean {
  if (p === "gemini") return !!Deno.env.get("GEMINI_API_KEY");
  if (p === "openai") return !!Deno.env.get("OPENAI_API_KEY");
  if (p === "anthropic") return !!Deno.env.get("ANTHROPIC_API_KEY");
  return false;
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
  // Decide provider: prefer the one matching the model prefix if its key is set.
  const requested = providerForModel(body?.model);
  let provider: Provider | null = requested && hasKey(requested) ? requested : null;
  if (!provider) provider = aiProvider();

  if (!provider) {
    return new Response(
      JSON.stringify({
        error:
          "No AI provider configured. Add a third-party API key (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY).",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  if (provider === "gemini") {
    const payload = { ...body, model: mapModelForGemini(body.model) };
    return fetch(GEMINI_OAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("GEMINI_API_KEY")}`,
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
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
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
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
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
