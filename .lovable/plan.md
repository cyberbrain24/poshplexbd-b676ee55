## Combo / Bundle Product System

Add a third product type `combo` alongside existing `simple` and `variable`, without changing how those work today.

### 1. Database (migration)

- Extend enum: `ALTER TYPE public.product_type ADD VALUE 'combo'`.
- New table `public.combo_items`:
  - `combo_product_id` → products.id (parent combo)
  - `child_product_id` → products.id (the existing product included)
  - `quantity` int default 1
  - `sort_order` int
  - unique (combo_product_id, child_product_id)
- GRANT SELECT to anon/authenticated; full CRUD to authenticated (admin-only via existing has_role policy pattern); ALL to service_role. Enable RLS with policies mirroring `product_images`.
- No stock column on combos: stock is fully derived from child products (existing Independent Inventory stays the source of truth for child SKUs). When an order is placed for a combo, the order pipeline expands it into its child SKUs × quantity for inventory deduction.

### 2. Types & constants

- `PRODUCT_TYPES` in `src/constants/index.ts` → add `COMBO: 'combo'`.
- `Product.product_type` union → `'simple' | 'variable' | 'combo'`.
- New `ComboItem` type; `Product.combo_items?: ComboItem[]` (joined).

### 3. Admin — ProductModal upgrade

- Replace "Product Type" select with three options: Simple / Variable / Combo. Keep existing UX for Simple & Variable untouched.
- When `product_type === 'combo'`:
  - Hide Variations tab content, Inventory section, and Variant builder.
  - Render new `ComboBuilder` component in place:
    - Searchable autocomplete (reuses existing `useProductSearch` debounced hook — already searches name + SKU) with dropdown of matching products (excludes self, excludes other combos to prevent nesting).
    - Selected items rendered as a vertical list of compact cards: thumbnail, name, SKU, base price, quantity stepper (default 1, first item = 1 as specified), drag handle for sort, trash icon to remove.
    - Live computed "Items total" vs the Combo's Base Price for reference (no auto-overwrite).
  - Category section stays — admin picks combo's own category (per spec: "category will be shown as selected category of combined product").
- Save flow: after upserting the product row, diff `combo_items` and insert/update/delete rows in a single batch (mirrors existing variant save pattern in `useProducts`).

### 4. Storefront — ProductDetail

- `ProductInfo.tsx`: detect `product_type === 'combo'`.
  - Hide existing `VariantSelector` / `ProductAttributesSelector` for the parent.
  - Render new `ComboConfigurator` component below short description:
    - Vertical accordion (shadcn Accordion) — one panel per child item.
    - Each row: thumbnail, name, "Configure" chevron, status badge ("Select options" / "✓ Configured").
    - Expanded view renders the child product's existing variant swatches: round color circles + bordered size rectangles (reuse `VariantSelector` styling, no dropdowns).
    - Independent per-child state: `Record<childProductId, { variantId, attributeValues }>`.
  - Add-to-Cart enabled only when every child with variants has a selected variant.
  - On add: push a single cart line representing the combo (combo product id + price), with a `comboChildren: [{ productId, variantId, quantity }]` payload on the cart item. Existing cart UI shows the combo name; checkout/order creation expands `comboChildren` into individual `order_items` so inventory + reports stay accurate with zero changes to downstream modules.

### 5. Hooks / services

- `useProducts` fetch: add `combo_items:combo_items(quantity, sort_order, child:products(id,name,sku,base_price,product_type,images:product_images(image_url,is_main),variants:product_variants(...)))` only when needed (lazy: ProductDetail fetch path).
- New `useComboChildren(productId)` for the storefront configurator (kept separate to avoid bloating list queries).
- Order creation path (`useCheckout` / order.service): if a cart item has `comboChildren`, expand into `order_items` rows with `parent_combo_order_item_id` reference (new nullable column on `order_items` — added in same migration) so the admin order view can still group them. Combo line price recorded once; child lines get price = 0 to avoid double counting.

### 6. Admin product list

- `AdminProducts.tsx`: add "Combo" badge variant; filter chip for `combo`.
- Storefront category pages: combos render via the same `ProductCard`; no changes needed (price = base_price, image = combo's own image).

### 7. Out of scope

- No nested combos (combo of combos).
- No per-child price overrides in v1 (combo total = parent base_price).
- No CSV import support for combos in this pass (BulkProductUpload mention stays as a future task).
- Existing simple/variable flows, variant builder, inventory, promotions, reviews — untouched.

### Files to create
- `supabase/migrations/<ts>_combo_products.sql`
- `src/components/admin/ComboBuilder.tsx`
- `src/components/product/ComboConfigurator.tsx`
- `src/hooks/useComboChildren.ts`

### Files to edit
- `src/constants/index.ts`, `src/types/product.ts`, `src/utils/validation-schemas.ts`
- `src/components/admin/ProductModal.tsx` (type select + conditional render)
- `src/hooks/useProducts.ts`, `src/hooks/useOptimizedProducts.ts` (combo_items join on detail fetch)
- `src/components/product/ProductInfo.tsx` (combo branch)
- `src/contexts/CartContext.tsx` (comboChildren payload passthrough)
- `src/hooks/useCheckout.ts` + `src/services/order.service.ts` (expand combo lines on order create)
- `src/pages/admin/AdminProducts.tsx` (badge + filter)
