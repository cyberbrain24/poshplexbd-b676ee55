# Combo Page: Variant Images + Pricing Transparency

Enhance the combo (bundle) product page only. The standard/single product page and variable product page stay exactly as they are.

## What changes for the customer

1. **Image follows the variant of each child product**
   - Each row in "Configure your bundle" shows the child product's main image by default.
   - When the customer picks a colour (or other variant) for that child, the row's thumbnail swaps to the image attached to that variant of the single product — same mapping the standalone product page uses.
   - If the selected variant has no dedicated image, fall back to the first product image that matches the chosen colour, then the product's main image.

2. **See individual prices vs combo price**
   - Each child row shows its own price: `৳XXX × qty` next to the name (single-product price, updated when a variant with a different selling price is picked).
   - A summary appears under the bundle list:
     - "Items total" — sum of each child's single price × quantity (struck-through)
     - "Combo price" — the parent combo product's base price
     - "You save ৳N (NN%)" — highlighted in the brand accent
   - The same "You save" line is mirrored next to the main price at the top of the product page (only when product type = combo).

3. **No other behaviour changes** — accordion, "Ready" badge, single-attribute auto-select, Add to Cart / Buy Now flow, cart payload, and checkout stay the same.

## Technical notes

Files touched (frontend only):

- `src/components/product/ComboConfigurator.tsx`
  - Compute `displayImage` per child: prefer `matchedVariant.image_url`, else first `product_images` row where `color_id === selectedColorId`, else `mainImage(child.images)`. Use it in both the accordion trigger thumbnail and (optionally) a small preview inside the expanded panel.
  - Add price line in the trigger: show `৳{unitPrice * qty}` using the same `matched?.selling_price ?? child.base_price` already computed.
  - Add a footer summary block inside the component computing `itemsTotal` from current `selections` and exposing it via the existing `onChange` callback (extend the second argument or add a third — see below).
  - Extend `onChange` signature to `onChange(selections, allReady, itemsTotal)` so `ProductInfo` can render the savings next to the main price without duplicating the math. Backwards compatible: only `ProductInfo` consumes it.

- `src/components/product/ProductInfo.tsx`
  - Receive `itemsTotal` from `handleComboChange`, store in state.
  - When `isComboProduct && itemsTotal > comboPrice`, render a small "Items total ৳X · You save ৳Y (Z%)" line directly under the existing price.
  - No changes to cart payload, checkout, or any other branch.

No DB, hook, or service changes — `useComboItems` already returns `product_variants.image_url` and `product_images.color_id`, so the variant-image lookup is purely client-side.

## Out of scope

- Standalone product / variable product image behaviour (untouched).
- Admin combo builder UI (untouched).
- Cart/checkout schema (untouched).
