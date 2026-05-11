// Unified AI chat completions helper.
// Prefers direct Google Gemini API (using GEMINI_API_KEY) when configured,
// otherwise falls back to the Lovable AI Gateway.

const GEMINI_OAI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const LOVABLE_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function aiProvider(): "gemini" | "lovable" | null {
  if (Deno.env.get("GEMINI_API_KEY")) return "gemini";
  if (Deno.env.get("LOVABLE_API_KEY")) return "lovable";
  return null;
}

/** Strip `google/` prefix and `-preview` suffix for direct Gemini API. */
function mapModelForGemini(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  let m = model.replace(/^google\//, "");
  // Direct Gemini API uses production model names; map preview Lovable IDs.
  m = m.replace(/-preview$/, "");
  // Common safe fallbacks
  if (m === "gemini-3-flash") m = "gemini-2.5-flash";
  if (m === "gemini-3.1-pro") m = "gemini-2.5-pro";
  if (m === "gemini-3-pro-image") m = "gemini-2.5-flash-image";
  return m;
}

/** Make a chat-completions request, transparently using Gemini direct or Lovable gateway. */
export async function aiChatCompletion(body: any, opts: { stream?: boolean } = {}): Promise<Response> {
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

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

  if (lovableKey) {
    return fetch(LOVABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  throw new Error("No AI provider configured (GEMINI_API_KEY or LOVABLE_API_KEY required)");
}
