## Goal

Replace the current "Select orders to generate a packing PDF" bar on /admin/orders with a compact selection toggle in the filter row. Selection persists across multiple searches/filters, and the top-right Packing PDF / CSV Report / PDF Report buttons download just the selected orders when any are selected.

## Changes — `src/pages/admin/AdminOrders.tsx`

### 1. Remove the existing selection action bar
Delete the entire block at lines 652–688 ("Selection action bar" with `Packing PDF (Selected)` button).

### 2. Stop resetting selection on filter change
In the effect at ~line 320 that resets `visibleLimit` when filters change, do NOT clear `selectedOrderIds`. Selection must survive across:
- typing in Search
- changing Status / Payment / Date / Location / Product filters
- Load More

Only an explicit "Clear" action empties it.

### 3. Add a compact "Select" control in the filter row (line 584–650)
Next to `ProductMultiSelectFilter`, add:

- A toggle button `Select` (outline, with `CheckSquare` icon). When ON:
  - shows checkbox overlays on each order card (already implemented at ~line 771)
  - shows count badge: `Select (N)` when N > 0
- A `Select all on page` mini-checkbox (only visible while toggle is ON)
- A `Show selected (N)` button (only visible when N > 0) — opens a modal listing just the selected orders
- A `Clear` link (only visible when N > 0)

A new state `selectionMode: boolean` gates the per-card checkbox rendering. When `selectionMode` is OFF, hide the overlay checkbox (line ~771) and disable the click-to-toggle behavior.

### 4. Top-right buttons become selection-aware (lines 516–541)
When `selectedOrderIds.size > 0`:

- `Packing PDF` → calls existing `handleDownloadSelectedPackingPdf` (renamed internally to operate on selection if present, else current full-list behavior). Label becomes `Packing PDF (N)`.
- `CSV Report` → exports CSV of selected orders only. Label becomes `CSV Report (N)`.
- `PDF Report` → generates report PDF for selected orders only. Label becomes `PDF Report (N)`.

When nothing is selected, all three keep their current behavior (full filtered list).

Implementation: introduce a `targetOrders` helper:
```ts
const targetOrders = selectedOrderIds.size > 0
  ? orders.filter(o => selectedOrderIds.has(o.id))
  : orders;
```
Pass `targetOrders` into existing `handleDownloadPdf`, `handleDownloadCsv`, `handleDownloadReportPdf` (small refactor — each currently reads `orders` directly).

Remove the now-redundant `handleDownloadSelectedPackingPdf` and `downloadingSelectedPdf` state; reuse the existing handlers and loading flags.

### 5. "Show Selected" modal (new lightweight component, inline)
A `Dialog` listing the selected orders in a compact table (Order #, Customer, Date, Total, Status, Payment). Each row has:
- click → opens `OrderDetailsDialog` (reuse existing)
- a small `X` to remove from selection

Header of the modal also includes the same 3 download buttons (Packing / CSV / PDF) for convenience, so the user can download directly from the review view.

No new file needed — keep this inline in `AdminOrders.tsx` to avoid touching unrelated modules.

## Out of scope / untouched

- `useOrders` hook
- `orderPackingPdf.ts`, `ordersReport.ts`, CSV exporter
- `ProductMultiSelectFilter`, `MultiSelectFilter`, `OrderLocationFilter`
- AI Agent packing-pdf tool (already shipped)
- Order card visuals (only adds/removes the checkbox overlay based on `selectionMode`)

## UX summary

```text
[Search] [Status▾] [Payment▾] [Date] [Location▾] [Products▾] [☑ Select (3)] [Show selected (3)] [Clear]

Top right: [Sync Steadfast] [Packing PDF (3)] [CSV Report (3)] [PDF Report (3)]
```

Workflow: enable Select → search "shirt" → tick a few orders → change filter to "Dhaka" → tick more → click `Show selected (5)` to review → hit `Packing PDF (5)` (or CSV/PDF Report) from the top bar.
