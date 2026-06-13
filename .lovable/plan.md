## Goal
Let the Admin AI Agent generate the **Packing List PDF** in the exact same format used on the All Orders page, on request (e.g. "make a packing list for today's pending orders" / "packing list for orders PO-101, PO-102, PO-103" / "packing list for all unshipped Dhaka City orders with t-shirts").

The PDF generator (`src/lib/orderPackingPdf.ts`) is reused unchanged, so the output is byte-for-byte the same layout the Orders page produces.

## How it works

### 1. New AI tool: `generate_packing_pdf` (server, read-only, auto-runs)
Added to `supabase/functions/admin-product-ai/index.ts`. Accepts ONE or more of these optional filters:
- `order_numbers: string[]` — explicit list (e.g. `["PO-101","PO-102"]`)
- `order_ids: string[]`
- `status` (single OR `statuses[]`) — order_status enum
- `payment_status` (single OR `payment_statuses[]`)
- `search` — order #, customer name, or phone
- `days` — last N days
- `date_from` / `date_to` — ISO dates
- `product_id` / `product_name` / `product_sku` — only orders containing the matching product
- `division_id` / `thana_id` / `division_name` / `thana_name`
- `only_unshipped: boolean` — `tracking_number IS NULL`
- `only_shipped: boolean`
- `limit` (default 500, hard cap 1000)

Server resolves matching order IDs (uses existing tables; no schema change). Returns:
```json
{
  "ok": true,
  "client_action": "download_packing_pdf",
  "order_ids": [...],
  "count": N,
  "summary": "12 orders matched (status=pending, last 1 day)"
}
```

Added to `READ_TOOLS` so it auto-executes without an approval prompt (it only generates a download; no DB writes).

### 2. Client intercept in `AdminProductAI.tsx`
After every backend round-trip, the client inspects the latest tool message(s) for a `client_action: "download_packing_pdf"` payload (parsed from JSON). When found:
1. Fetches those orders with the same nested SELECT shape used by `useOrders` (customer, items → product → product_images, payment_method, shipping_division, shipping_thana, plus `consignment_id` / `tracking_number` / `call_center_notes`).
2. Calls `generatePackingListPdf(orders)` from `src/lib/orderPackingPdf.ts` — **same generator the All Orders page uses, so the format is identical** (summary page with totals + category/size/colour aggregates, then per-parcel image grids with sizes, parcel IDs, call notes).
3. Shows a toast: "Packing list ready — N orders".
4. De-dupes via a `processedActionsRef` Set keyed by `tool_call_id` so re-renders don't trigger duplicate downloads.

### 3. Onboarding hints in the assistant
Append example prompts under "Try asking:" in the AI Agent UI:
- "Make a packing list PDF for today's pending orders"
- "Packing list for PO-101, PO-102, PO-103"
- "Packing list for all unshipped orders in Dhaka City"

### 4. System prompt nudge
Add one sentence to the agent's system prompt telling it to call `generate_packing_pdf` whenever the admin asks for a packing list / packing PDF / picking list, and to summarise the matched count in its reply.

## Files touched
- `supabase/functions/admin-product-ai/index.ts` — add `generate_packing_pdf` tool definition, server resolver, system-prompt line, add to `READ_TOOLS`.
- `src/components/admin/AdminProductAI.tsx` — add side-effect interceptor + `downloadPackingPdfForOrderIds` helper, prompt hints.

## Safety / no-regression
- No DB schema changes.
- No edits to `useOrders.ts`, the Orders page, the PDF generator, or the existing AI tools.
- Tool is read-only; no approval flow needed.
- Hard cap of 1000 orders per PDF to keep generation responsive.
- If the matched count is 0, the tool returns `count: 0` with no `client_action`, so the agent can ask the admin to refine filters instead of producing an empty PDF.
