## Goal
Add a "Customer Reviews" showcase to the homepage (bottom, above footer) styled like the attached "Fit Check Community Archive" mockup, plus a dedicated `/reviews` page and a "Featured" toggle on the admin reviews page so admins control which reviews appear on the homepage.

## 1. Schema change
Add a `is_featured` flag to `reviews`:
```sql
ALTER TABLE public.reviews ADD COLUMN is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX reviews_featured_idx ON public.reviews(is_featured) WHERE is_featured = true;
```
No RLS/GRANT changes — existing policies cover the column.

## 2. Admin: feature toggle
`src/pages/admin/AdminReviews.tsx`
- Add a star icon button next to the approve/reject/view/delete row that toggles `is_featured` (only enabled when review is approved). Filled star = featured.
- Add "Featured" filter option in the existing Select.
- Show a "Featured" badge next to the Approved/Pending badge when set.

## 3. Homepage section
New `src/components/home/CustomerReviewsSection.tsx`:
- Heading block matching the mockup: huge bold uppercase title "THE FIT CHECK / COMMUNITY / ARCHIVE" with a graffiti-style accent, subtitle "POSHPLEX // CUSTOMER REVIEWS // #POSHPLEXFIT".
- Masonry/asymmetric grid of up to 8 featured + approved reviews (newest first). Each card uses the polaroid/taped-photo aesthetic from the mockup:
  - Large review image (first photo from `images[]`, falls back to product main image if none).
  - Small avatar circle (initials chip if no avatar), reviewer display name (`@handle`-style derived from `customer.name` or `reviewer_name`), "Verified Purchase" tag when `customer_id` is set.
  - Star rating, review content (line-clamp-3), date, and two hashtag chips (#HoodieSeason #StreetwearDaily as static brand tags).
  - Entire card links to `/product/<product_id>`.
- "LOAD MORE LOOKS" button bottom-right linking to `/reviews`.
- Hidden entirely if there are zero featured approved reviews.

Hook: `src/hooks/useFeaturedReviews.ts` — query `reviews` where `is_approved=true AND is_featured=true`, embed product + main image + customer name, limit 8.

Mount in `src/pages/Index.tsx` just before `OurStorySection` (lazy-loaded, same Suspense pattern).

## 4. Dedicated `/reviews` page
New `src/pages/CustomerReviews.tsx`:
- PoshplexHeader + Footer wrapper.
- Same heading style as the homepage section.
- Filter bar: rating filter (All / 5★ / 4★+ / with photos).
- Infinite-scroll/paginated grid (20 per page) of ALL approved reviews using the same card component as the homepage. Featured reviews float to the top, then newest first.
- Each card links to the linked product page.
- Route added in `src/App.tsx`: `/reviews` → `CustomerReviews` (lazy-loaded).

Extract `ReviewLookCard.tsx` so homepage and reviews page share the same card.

## 5. Files touched
- **Migration**: add `is_featured` column + partial index.
- **New**: `src/hooks/useFeaturedReviews.ts`, `src/hooks/useAllReviews.ts`, `src/components/home/CustomerReviewsSection.tsx`, `src/components/reviews/ReviewLookCard.tsx`, `src/pages/CustomerReviews.tsx`.
- **Edited**: `src/pages/admin/AdminReviews.tsx` (feature toggle + filter + badge), `src/pages/Index.tsx` (mount section), `src/App.tsx` (add `/reviews` route).

## Notes
- Uses existing `review-images` URLs; no new uploads or buckets.
- Customer handle is generated client-side from the name (lowercase, spaces → underscore, prefixed with `@`). No DB handle field needed.
- Hashtag chips are static brand decoration to match the mockup — not editable per review (can be added later if you want).
