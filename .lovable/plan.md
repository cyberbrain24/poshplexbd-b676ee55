## Goal
Add a product filter (multi-select with search) to the Admin Orders page and let the admin tick orders, then generate a Packing PDF for the selected orders only — without changing existing logic.

## Changes (frontend only, additive)

### 1. New product filter on Admin Orders toolbar
- Add a searchable multi-select "Products" filter next to the existing filters in `src/pages/admin/AdminOrders.tsx`.
- Component: new `src/components/admin/ProductMultiSelectFilter.tsx` — a `Popover` with a debounced search input (300ms) that queries `products` by `name` / `sku` (limit 20, matching existing `useProductSearch` pattern) and lets the admin pick multiple products. Picked items show as chips above the list (sticky), so admin can search again and add more.
- State in AdminOrders: `productFilter: { id: string; name: string }[]`.
- Filtering: applied **client-side** on the already-fetched `orders` array — keep an order if any of its `items[].product_id` is in the picked set. This avoids touching `useOrders` SQL and the order/limit logic.
- Add `productFilter.length > 0` to `hasActiveFilters` so the "all results" behavior already in place kicks in (no Load More cap when filtering).

### 2. Row selection + selected count
- Add a checkbox column (leftmost) in the orders table; header checkbox toggles select-all of currently visible (post-filter) rows.
- State: `selectedOrderIds: Set<string>`. Reset when filters change.
- Show a small toolbar strip above the table when `selectedOrderIds.size > 0`: "N selected · Clear · Packing PDF (Selected)".

### 3. Packing PDF for selected orders
- Reuse existing `generatePackingListPdf(orders)` from `src/lib/orderPackingPdf.ts` unchanged.
- New handler `handleDownloadSelectedPackingPdf` filters the current `orders` array by `selectedOrderIds` and calls the same generator.
- Existing "Packing PDF" button stays as-is (acts on current view).

## Safety / no-regression notes
- No changes to `useOrders`, `useSteadfast`, DB, or PDF generator.
- Product filter runs purely on already-loaded rows; if no filter, behavior is identical.
- Checkboxes use `e.stopPropagation()` so they don't trigger the existing row-click → Order Detail modal.

## Files touched
- `src/pages/admin/AdminOrders.tsx` — add state, filter UI, checkbox column, selected-action bar, new handler.
- `src/components/admin/ProductMultiSelectFilter.tsx` — new component.
