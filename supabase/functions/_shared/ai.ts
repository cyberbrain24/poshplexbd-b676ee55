// Unified AI chat completions helper.
// Uses ONLY third-party AI providers (Gemini / OpenAI / Anthropic).
// Lovable AI Gateway is intentionally NOT used.

const GEMINI_OAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export function aiProvider(): "gemini" | "openai" | "anthropic" | null {
  if (Deno.env.get("GEMINI_API_KEY")) return "gemini";
  if (Deno.env.get("OPENAI_API_KEY")) return "openai";
  if (Deno.env.get("ANTHROPIC_API_KEY")) return "anthropic";
  return null;
}

/** Strip `google/`/`openai/` prefixes and `-preview` suffix; map common Lovable IDs to real Gemini names. */
function mapModelForGemini(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  let m = model.replace(/^google\//, "").replace(/^openai\//, "");
  m = m.replace(/-preview$/, "");
  if (m.startsWith("gpt-")) m = "gemini-2.5-flash";
  if (m === "gemini-3-flash") m = "gemini-2.5-flash";
  if (m === "gemini-3.1-pro") m = "gemini-2.5-pro";
  if (m === "gemini-3-pro-image") m = "gemini-2.5-flash-image";
  return m;
}

function mapModelForOpenAI(model?: string): string {
  if (!model) return "gpt-4o-mini";
  let m = model.replace(/^openai\//, "").replace(/^google\//, "");
  if (m.startsWith("gemini")) m = "gpt-4o-mini";
  return m;
}

/** Make a chat-completions request via the configured third-party provider. */
export async function aiChatCompletion(body: any, _opts: { stream?: boolean } = {}): Promise<Response> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (geminiKey) {
    const payload = { ...body, model: mapModelForGemini(body.model) };
    return fetch(GEMINI_OAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (openaiKey) {
    const payload = { ...body, model: mapModelForOpenAI(body.model) };
    return fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (anthropicKey) {
    // Anthropic has a different schema; only basic text is mapped.
    const messages = (body.messages || []).filter((m: any) => m.role !== "system");
    const system = (body.messages || []).find((m: any) => m.role === "system")?.content;
    const resp = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-latest",
        max_tokens: 4096,
        system,
        messages,
      }),
    });
    // Re-shape Anthropic response into OpenAI-style for callers.
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

  return new Response(
    JSON.stringify({
      error:
        "No AI provider configured. Add a third-party API key (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY).",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}
