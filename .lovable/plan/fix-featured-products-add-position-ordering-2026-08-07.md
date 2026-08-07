# Fix Featured Products + Add Position Ordering

## What's happening now

18 products are marked Featured in the database, but the homepage Featured section shows only 10 of them, picked by "last updated" date. So when you mark a product as Featured in admin, it often does not appear — an older-but-recently-edited product takes the slot. The Featured toggle itself only lives inside the product edit popup, so there is no quick way to see or manage the featured set.

## What will change

**Admin — product list**
- New "Featured" star column in the product table: click the star to feature/unfeature instantly, no need to open the product.

**Admin — Featured Products ordering**
- A new "Featured Products" panel (accessible from the Products page) listing only featured products.
- Each row has a position number box (1, 2, 3, ...). Type a number to move the product to that position; the rest renumber automatically.
- Up/down arrow buttons for quick moves.
- Products display on the homepage in exactly this order, with a clear marker showing which ones fall outside the 10 visible slots.

**Storefront**
- Featured section orders by the admin-defined position instead of last-updated date.

## Technical details

- Migration: add `featured_sort_order integer not null default 0` to `products`; backfill existing featured products sequentially by current `updated_at`. No RLS/grant changes needed (existing product policies cover it).
- `useFeaturedProducts`: order by `featured_sort_order` ascending, then `created_at` desc as a tiebreaker; keep the inactive-category filter and 10-item cap.
- `useProducts`: include `featured_sort_order` in create/update payloads; add a lightweight `useToggleFeatured` mutation invalidating `products-optimized` and `featured-products`.
- `useOptimizedProducts`: already selects `is_featured`; add `featured_sort_order` to the select for the admin list.
- New `src/components/admin/FeaturedProductsPanel.tsx` for the reorder UI; batch-save positions with a single update per changed row.
- No changes to checkout, orders, tracking, or any other module.
