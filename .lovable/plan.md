# Add Custom Variants

Introduce a third optional variant attribute called **Custom Variant** that behaves exactly like Color and Size: managed in a global admin library, optionally mixed into the variant matrix, and selectable on the product page. Existing products, orders, and variants stay untouched (the new column is nullable).

## Database

New migration:
- `CREATE TABLE public.custom_variants (id, label TEXT UNIQUE, sort_order INT, is_active BOOL, created_at, updated_at)` + GRANTs (public SELECT, authenticated/service_role write) + RLS (`is_admin()` for writes, public read), mirroring `sizes`.
- `ALTER TABLE public.product_variants ADD COLUMN custom_variant_id UUID NULL REFERENCES public.custom_variants(id)`.
- Update the variant uniqueness/dedup constraint (if any) to include `custom_variant_id`.

Nothing else changes — all existing rows get `NULL` and continue to work.

## Admin – Master Data

- New page `src/pages/admin/AdminCustomVariants.tsx` mirroring `AdminSizes.tsx` (list, add, edit, delete, sort order, active toggle).
- Add route + sidebar entry in `AdminSidebar` / router under the same group as Colors/Sizes/Materials.
- Extend `useMasterData` to fetch `customVariants`.
- Extend `useAttributeDeletionCheck` with a `custom-variant` config pointing to `product_variants.custom_variant_id` so deletion is blocked when in use.

## Admin – Product upload / edit (ProductModal + VariantBuilder + VariantTable)

- `src/types/product.ts`: add `CustomVariant` type and `custom_variant_id`/`custom_variant` on `ProductVariant` + `VariantFormData`.
- `src/services/product.service.ts`: include `custom_variant:custom_variants(id,label)` in product variant selects and pass `custom_variant_id` on insert/update.
- `VariantBuilder.tsx`: add a **Custom Variants** multi-select block placed **directly below Sizes** (and above Materials). Include it in the cartesian product, dedup key, and `previewCount`. All three (color/size/custom) remain independently optional — generate button enables when any one is selected.
- `VariantTable.tsx`: show a "Custom" column with a select of custom variants (only rendered when at least one row uses it or when the product has any selected, to keep the table compact for existing products).

## Storefront – Product page

- `src/components/product/VariantSelector.tsx`: add a third selector block below Size that renders the unique active `custom_variant` options as text pills (same styling/sizing as size buttons). Wire it into the selection state so a variant only resolves when every present axis (color/size/custom) is chosen. Auto-select when there's only one option, and gray out unavailable combinations exactly like color/size do today.
- No changes to add-to-cart payload structure beyond passing the resolved `ProductVariant` (already includes the joined `custom_variant`). Cart/checkout/order item snapshot already serializes `variant_details` as JSON, so the custom label will flow through orders and the packing PDF automatically once added to `variant_details`.

## Non-goals / safety

- No changes to existing orders, inventory, packing PDF logic, or RLS on other tables.
- No data migration required; column is nullable.
- Filters/category pages are not extended in this pass (can be added later if requested).

## Technical notes

- Naming: table `custom_variants`, column `custom_variant_id`, label field `label` (matches `sizes.label`).
- Sidebar grouping follows existing Master Data pattern (Colors / Sizes / Materials / **Custom Variants**).
- Variant dedup key becomes `${color_id}|${size_id}|${material_id}|${custom_variant_id}`.
