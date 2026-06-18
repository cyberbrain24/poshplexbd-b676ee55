## Plan: Storefront-style variant picker on Add Order

Replace the current "Choose Variant" list (one row per variant) on `/admin/add-order` with the same `VariantSelector` used on the storefront product page — color swatches + size buttons (+ custom option buttons), with auto-resolution to the matching variant.

### Changes — `src/pages/admin/AdminAddOrder.tsx` only

1. **Expand the product detail fetch** so variants carry full color/size/custom data the selector needs:
   - `color:colors(id, name, hex_code)`
   - `size:sizes(id, label, sort_order)`
   - `custom_variant:custom_variants(id, label, sort_order)`

2. **Swap the variant list UI** for `<VariantSelector variants={...} onVariantChange={setSelectedVariant} />` (imported from `@/components/product/VariantSelector`).

3. **Selected-variant preview + Add button (mobile-friendly):**
   - Below the selector, show a compact strip: thumbnail (variant image or product main), variant label (Color / Size), SKU, stock, price.
   - Sticky bottom action area inside the sheet with a full-width `Add to Order` button (`h-12`), disabled until a variant is chosen (or product has no variants → enabled with base price).
   - Keep existing `Back` button at top.

4. **Mobile polish:**
   - Sheet stays full-height (`h-[100dvh]`).
   - Header + product summary scroll, selector content centered with comfortable spacing, action button pinned at the bottom with safe-area padding.
   - Touch targets already 40px+ from the storefront selector — kept as-is.

### Out of scope / unchanged
- No DB or RPC changes.
- Order creation flow, creator tagging, totals, promo, payment — untouched.
- Storefront `VariantSelector` component is reused without modification.
