# Mobile Cold-Load Refactor (Home / Category / Product)

Scope: data-fetching + boot-shell + skeletons only. No UI/UX/style changes. All changes gated to mobile (`max-width: 767px`) where they could affect desktop.

## 1. Inline Boot Shell (`index.html`)

Inject a small inline `<style>` + `<div id="boot-shell">` inside `#root` so the first HTTP response paints:
- Announcement bar strip (black, ~28px)
- Header bar (logo placeholder, hamburger square, cart square)
- Hero placeholder (aspect 4:5 muted block on mobile, 16:7 on desktop)
- 2-col product grid skeleton (6 tiles) below fold

Boot shell auto-removed by React on first render (the existing root replaces it). Pure HTML+CSS, zero JS. Wrapped in `@media (max-width: 767px)` for the mobile-tuned variant; desktop keeps the current minimal shell.

## 2. Route Code-Splitting (`src/App.tsx`)

Audit existing `lazy()` usage. Convert any remaining eager route imports for `Index`, `Category`, `ProductDetail` to `lazy()` (verify they already are). Ensure NO cross-imports between these three pages (`Index` must not statically import anything from `Category`/`ProductDetail` and vice versa). Replace blank `Suspense fallback={null}` with route-specific skeletons.

## 3. Route Skeletons (new files)

- `src/components/skeletons/HomeSkeleton.tsx`
- `src/components/skeletons/CategorySkeleton.tsx`
- `src/components/skeletons/ProductDetailSkeleton.tsx`

Each mirrors the real layout's outer dimensions to avoid CLS. Used as `Suspense fallback` in `App.tsx` and as the `isLoading` fallback inside the page.

## 4. Data-Fetching Optimization

Goal: drop redundant calls on cold mobile load. No schema changes.

### Home (`src/pages/Index.tsx` + hooks)
- `useStorefrontPrefetch` already prefetches branding+categories. Keep.
- Combine `useFeaturedProducts` + `useHomepageProducts` lookup: both query `products` with similar columns. Add `useIsMobile()` gate — on mobile, defer `ProductGrid` (latest 10) until visible (already lazy via `LazyOnVisible`); also defer `CustomerReviewsSection` query (already lazy). Verify `FeaturedProducts` query doesn't double-fire.
- Deduplicate: ensure `["site-branding"]` query key matches the one `HeroSection` uses (so the prefetch actually hits). Fix mismatched keys if found.

### Category (`src/pages/Category.tsx`)
- `useOptimizedCategoryProducts` is called twice (once in `Category` for counts, once in `ProductGrid`). Refactor `ProductGrid` to accept the products/loading state as props from the parent OR share via a single React Query key so the second call is a cache hit (already same key — verify no param drift causing miss).
- Mobile: reduce initial page size in the query (e.g. 8 → enough for 2-col viewport) with second page fetched by existing "Load More". Desktop keeps current page size.

### Product (`src/pages/ProductDetail.tsx`)
- `useProduct` stays. Defer `RelatedProducts` and bottom `PromotionSlot` queries on mobile until scrolled into view (wrap in `LazyOnVisible`).
- Defer `trackViewContent` (Meta Pixel) to `requestIdleCallback` so it doesn't compete with LCP.

## 5. LCP & Image Loading

- `HeroSection`: set hero `<img>` to `fetchpriority="high"` + `loading="eager"` + `decoding="async"`. Add `<link rel="preload" as="image">` via `Helmet` using the resolved mobile hero URL (existing pattern from `ProductGrid`).
- `ProductImageGallery`: main image eager + high priority; all thumbnails + secondary images `loading="lazy"` + `decoding="async"`.
- `ProductGrid` (category): only the first tile gets `priority`; rest stay lazy (already correct — verify).
- `ResponsiveImage`: ensure mobile `sizes` attr targets ~50vw for 2-col grid and 100vw for hero so the browser picks the smallest variant.

## 6. Verification

- `bun run build` and confirm separate chunks for `Index`, `Category`, `ProductDetail`.
- Playwright mobile viewport (390×844) cold-load `/`, `/category/all`, `/product/...`: screenshot boot shell visible <100ms; verify no double-fetch in network panel.

## Technical Notes

- Mobile gate: `useIsMobile()` (existing hook, 768px breakpoint) or CSS media queries in `index.html`.
- All new skeletons use existing `Skeleton` primitive from `src/components/ui/skeleton.tsx`.
- No backend, RLS, or schema work.
- Files touched: `index.html`, `src/App.tsx`, `src/pages/{Index,Category,ProductDetail}.tsx`, `src/components/home/HeroSection.tsx`, `src/components/product/ProductImageGallery.tsx`, `src/components/category/ProductGrid.tsx`, `src/hooks/useStorefrontPrefetch.ts`, `src/hooks/useOptimizedProducts.ts`, plus 3 new skeleton files.

Approve to proceed.
