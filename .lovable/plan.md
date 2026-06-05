## Changes to `src/components/admin/AdminProductAI.tsx`

1. **Rename** the header label `PRODUCT AI` → `AI AGENT` (and update the AdminAIAssistant page title from "Admin AI Assistant" → "Admin AI Agent", and sidebar label if present).
2. **Bigger prompt field**: bump the textarea from `rows={3}` / `min-h-[72px] max-h-48` to roughly `rows={5}` / `min-h-[140px] max-h-80`, with larger `text-base` and more padding so it is comfortable to edit.
3. **Move resize handle to top-right**: the native `<textarea>` resize grip is locked to the bottom-right corner by browsers and cannot be relocated with CSS. Implementation:
   - Set `resize: none` on the textarea.
   - Wrap it in a relative container and add a small custom drag handle (8×8 grip icon) absolutely positioned at the **top-right** corner.
   - On pointer-down on the handle, capture the pointer and adjust the textarea `height` based on vertical drag delta (drag **up** = grow, drag **down** = shrink), clamped between min and max heights. Standard `onPointerMove` / `onPointerUp` with `setPointerCapture`. No external library.

## Fix `supabase/functions/admin-product-ai/index.ts` "AI service error"

Edge logs show `Provider returned error 400` from Gemini on every call. The tool schema is large (50+ tools with nested params) and Gemini 2.5 Flash's constrained-decoding state limit rejects it — a known issue documented in the AI Gateway guidance.

- Switch `MODEL` from `google/gemini-2.5-flash` to `google/gemini-3-flash-preview` (current default chat model, handles bigger tool schemas more reliably). If it still 400s on retry, fall back to `openai/gpt-5-mini`.
- No other behavior changes; the tool list and prompts stay the same.

## Out of scope

- No changes to tool definitions, conversation logic, RLS, or other admin pages.
- No changes to streaming/non-streaming flow.
