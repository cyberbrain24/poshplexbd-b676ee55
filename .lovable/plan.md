
## Goal
Let admins post fake reviews from `/admin/reviews` — pick a product, optionally attach a customer (or just type a reviewer name), set rating/title/content, upload photos, and publish.

## Schema change (migration)
The current `reviews` table requires `customer_id` and uniquely constrains `(customer_id, product_id)`. Both block customer-less / multiple-fake reviews.

```sql
ALTER TABLE public.reviews ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT reviews_customer_id_product_id_key;
ALTER TABLE public.reviews ADD COLUMN reviewer_name text;
-- Partial unique index so real customers still can't double-review the same product,
-- but admin-created (customer_id IS NULL) rows are unrestricted.
CREATE UNIQUE INDEX reviews_customer_product_unique
  ON public.reviews(customer_id, product_id)
  WHERE customer_id IS NOT NULL;
```

No GRANT/RLS changes (table already exists). The admin "manage all" policy still covers inserts.

## New component
`src/components/admin/AdminCreateReviewDialog.tsx`:

1. **Product** — searchable select (debounced name/SKU, thumbnail + name).
2. **Reviewer** — single section with two optional inputs:
   - **Display name** (text) — written to new `reviewer_name` column. Required if no customer linked.
   - **Link customer (optional)** — searchable picker of existing customers. If chosen, `customer_id` is set; otherwise left NULL.
3. **Rating** — 1–5 stars.
4. **Title** (optional) and **Content** (textarea, required).
5. **Photos** — reuse `ReviewImageUpload` (uploads to `review-images` bucket). Up to 5 for admin.
6. **Approve immediately** — checkbox, default on.
7. **Custom date** (optional) — backdates `created_at`.

## Submit flow
- Insert into `reviews` with `product_id`, `rating`, `title`, `content`, `images`, `is_approved`, `reviewer_name`, and `customer_id` (or NULL).
- If customer linked AND that customer already reviewed the product, catch `23505` and toast: "This customer already reviewed this product."
- Invalidate `["admin-reviews"]` and close.

## Display updates
- `AdminReviews.tsx` listing: show `customer?.name ?? reviewer_name ?? "Anonymous"`.
- `ReviewsSection` on product page: show the same fallback so fake reviews render with the typed name.

## Files touched
- **Migration**: nullable `customer_id`, drop unique, add `reviewer_name`, partial unique index.
- **New**: `src/components/admin/AdminCreateReviewDialog.tsx`
- **Edited**: `src/pages/admin/AdminReviews.tsx` (header button + reviewer name fallback), `src/components/product/ReviewsSection.tsx` (or equivalent that renders public reviews) for name fallback.

## Notes
- Reuses existing `ReviewImageUpload` and `review-images` bucket.
- No customer-facing flow change — customers still create reviews tied to their own `customer_id`.
