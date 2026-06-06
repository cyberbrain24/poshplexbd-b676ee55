## Reviews Section Overhaul

### 1. Admin Reviews — Grid view, Edit, and Search
File: `src/pages/admin/AdminReviews.tsx`

- Replace the vertical list with a **6-column responsive grid** (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`, `gap-3`).
- Each tile: square product/review image, rating stars, product name (truncate), reviewer name, content (line-clamp-2), status badges (Approved/Pending/Featured), compact action bar: Approve/Reject, Feature toggle, **Edit**, View, Delete.
- Keep existing status filter dropdown, counts, and "Create Review" button.
- **New search bar** in the header (300ms debounced) — searches across customer name, customer phone, reviewer name (for unlinked reviews), product name, product SKU, and review title/content.
  - Implementation: fetch reviews with their joined `customer` + `product` as today, then client-side filter the result set by the debounced query (case-insensitive substring match across `customer.name`, `customer.phone`, `reviewer_name`, `product.name`, `product.sku`, `title`, `content`). Keeps it simple and works with the existing query.
  - Add a small "X" clear button and result count ("Showing N of M reviews").
- New **Edit Review dialog** (`src/components/admin/AdminEditReviewDialog.tsx`) — reuses fields from `AdminCreateReviewDialog` (rating, title, content, images via `ReviewImageUpload`, reviewer name, approved, created_at date). Product and linked customer are read-only in edit mode. Updates via `supabase.from("reviews").update(...).eq("id", id)`.
- After save, invalidate `admin-reviews`, `featured-reviews`, `all-public-reviews`, `product-reviews`.

### 2. Product Page Reviews — Grid + Customer Edit
File: `src/components/product/ProductDescription.tsx` (Customer Reviews accordion body)

- Replace stacked list with a **grid**: `grid-cols-2 lg:grid-cols-5 gap-3` (2 cols mobile, 5 cols desktop).
- Each tile: square first review image (fallback to product image), rating stars, title (if any), content (line-clamp-3), reviewer name + date. Image-forward, compact.
- Clicking a tile opens a lightbox/dialog with full review and full-size images (reuse `ImageLightbox`).
- **Customer edit**: if logged-in customer authored the review (`review.customer_id === currentCustomer.id`), show a pencil "Edit" button on their own tile. Opens `src/components/product/EditMyReviewDialog.tsx` for rating/title/content/images, using existing `useUpdateReview`. On save, set `is_approved = false` (pending re-moderation). Invalidate `product-reviews`.
- Use the same auth/customer source `ReviewProduct.tsx` already uses.

### 3. Homepage Customer Reviews — 6-col Auto Carousel
File: `src/components/home/CustomerReviewsSection.tsx`

- Replace the static 4-col grid with a **carousel showing 6 cards per view on desktop** (`lg:basis-1/6`, `md:basis-1/4`, `sm:basis-1/3`, `basis-1/2` mobile) using the existing shadcn `Carousel` (embla).
- Configure embla with `loop: true` plus **autoplay** (`embla-carousel-autoplay`, `bun add embla-carousel-autoplay`), `delay: 3500`, `stopOnInteraction: false`, `stopOnMouseEnter: true`.
- Raise featured-reviews fetch limit to ~18 (`src/hooks/useFeaturedReviews.ts`).
- Keep heading, kicker, and "Load More Looks" CTA. Subtle prev/next arrows on desktop hover.
- Slides reuse existing `ReviewLookCard`.

### 4. No DB changes
All needed columns (`is_approved`, `is_featured`, `images`, `reviewer_name`, `customer_id`) already exist.

### Files
- Edit: `src/pages/admin/AdminReviews.tsx`
- Edit: `src/components/product/ProductDescription.tsx`
- Edit: `src/components/home/CustomerReviewsSection.tsx`
- Edit: `src/hooks/useFeaturedReviews.ts`
- New: `src/components/admin/AdminEditReviewDialog.tsx`
- New: `src/components/product/EditMyReviewDialog.tsx`
- Install: `embla-carousel-autoplay`
