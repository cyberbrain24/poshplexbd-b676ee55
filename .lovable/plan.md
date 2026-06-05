## Goal

Remove the separate "Product Attributes" picker block above the variants table. Instead, make selected attributes appear as **dynamic columns inside the existing variant system** — placed right after the Custom column — and participate in Auto-Generate exactly like Color / Size / Material / Custom.

## UX after the change

```
[Image] [Color] [Size] [Material] [Custom] [Style ▼] [Edition ▼] ... [Price] [SKU] [×]
```

- The Product Attributes picker (Drop Sizes / Baggy Sizes checkboxes shown in your screenshot) **moves into the Variant Builder panel**, sitting next to the Colors / Sizes / Custom / Materials selectors. Picking an attribute there both (a) applies it to the product and (b) adds its column to the table.
- Each selected attribute becomes one extra dropdown column per variant row, populated from that attribute's values (e.g. Style → Design 1 / Design 2).
- Auto-Generate produces the full cartesian product across Color × Size × Custom × Material × every selected attribute, deduped against existing rows.
- Customer-facing storefront keeps using the same attribute selectors (no change for shoppers).

## Implementation

### Data model (already exists, no migration)
- `product_applied_attributes` — which attributes apply to a product.
- `product_variant_attribute_values(variant_id, attribute_id, attribute_value_id)` — per-variant value picks. We will start using this table; today it's empty.

### Frontend

1. **`VariantFormData`** (`src/types/product.ts`): add `attribute_values: Record<attributeId, valueId | null>` and optional `id` for existing rows.

2. **`ProductModal.tsx` — Variants tab**
   - Remove the standalone `ProductAttributesPicker` block above the variants table.
   - Keep `selectedAttributeIds` state; it now drives both the builder selectors and the dynamic table columns.
   - Pass `appliedAttributes` (full attribute + values, derived from `useProductAttributes()` filtered by `selectedAttributeIds`) into `VariantBuilder` and the variants table.
   - On save: after upserting variants, sync `product_variant_attribute_values` per variant (delete old rows for the variant, insert current picks). Continue calling `useSyncProductAttributes` for `product_applied_attributes`.
   - On load (edit mode): hydrate each variant's `attribute_values` from `product_variant_attribute_values`.

3. **`VariantBuilder.tsx`**
   - Add a "Product Attributes" multi-select block (checkbox list of all global attributes — same look as the current picker, but inline with Colors/Sizes/Custom/Materials).
   - For each *checked* attribute, render a chips row of its values (same UI pattern as Sizes) so the admin can pick which values to include in the cartesian product.
   - Extend `previewCount` and `handleGenerate` to multiply in each selected attribute's chosen values and write them into `attribute_values` on each generated row.
   - Checking/unchecking an attribute here calls `onAttributeToggle(id)` so the parent updates `selectedAttributeIds` and the table columns appear/disappear live.

4. **Variants table inside `ProductModal.tsx`** (the inline `<Table>` block, lines ~817+)
   - After the Custom column, render one `<TableHead>` per applied attribute (attribute name) and one `<TableCell>` per row containing a `<Select>` of that attribute's values (plus a "None" option).
   - `updateVariantField` gains a helper `updateVariantAttribute(index, attributeId, valueId)` that writes into `variants[index].attribute_values`.
   - `addNewVariant` and `handleBuilderGenerate` initialize `attribute_values` as `{}` for any attribute without a pick.

5. **Storefront** — no changes. `ProductAttributesSelector` keeps reading `product_applied_attributes` and shows pills; selecting a value should already match a variant once `product_variant_attribute_values` is populated. (If variant matching by attribute isn't wired yet, that becomes a follow-up — flagged below.)

### Save flow detail

```
saveProduct()
  upsert product row
  upsert variants (existing path)
  syncProductAttributes(productId, selectedAttributeIds)        // product_applied_attributes
  for each saved variant:
    delete from product_variant_attribute_values where variant_id = v.id
    insert rows for every (attribute_id, value_id) in v.attribute_values where value_id != null
```

### Open follow-up (out of scope here, call out only)
- Matching a customer's attribute pick to the correct variant on the product page. Today `VariantSelector` matches on color/size/material/custom only. If you want the dynamic attributes to drive variant selection (price, image, stock) on the storefront, that selector logic also needs to consider `product_variant_attribute_values`. Confirm whether to include that in this same change or treat as a follow-up.

## Files touched

- `src/types/product.ts` — extend `VariantFormData`.
- `src/components/admin/VariantBuilder.tsx` — attributes multi-select + value chips + cartesian expansion.
- `src/components/admin/ProductModal.tsx` — remove top picker, add dynamic columns, hydrate + save `product_variant_attribute_values`.
- `src/components/admin/ProductAttributesPicker.tsx` — no longer used in Variants tab (kept for possible reuse, or deleted if unused elsewhere).
