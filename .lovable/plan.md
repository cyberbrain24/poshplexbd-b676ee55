# Lazy Loading for Home, Category & Subcategory Pages

Scope narrowed per your request: optimize **only** the pages users land on directly — Home (`/`), Category (`/category/:category`), and Category Browser / subcategories (`/categories`). Goal is instant first paint on those routes.

## What changes

### 1. Defer below-the-fold homepage sections until scroll
On `Index.tsx`, sections currently using `Suspense` still get scheduled to load right after first paint. Switch them to **scroll-triggered** loading using a small `IntersectionObserver` wrapper:
- `FeaturedProducts`
- `ProductGrid`
- `CustomerReviewsSection`
- `OurStorySection`
- Middle/bottom `PromotionSlot`s

The hero, header, features bar, and category strip stay eager so the first paint is instant. Each deferred section reserves height to prevent layout shift (CLS).

### 2. Lazy-load images on Home / Category / Subcategory
Add `loading="lazy"` + `decoding="async"` to product card images on these pages, **except** the first row (first 4 cards on desktop / first 2 on mobile) which become `loading="eager"` + `fetchpriority="high"` so above-the-fold imagery still loads immediately.

Files touched:
- `src/components/home/ProductGrid.tsx`
- `src/components/home/FeaturedProducts.tsx` (verify)
- `src/components/home/CategorySection.tsx` (verify)
- Category page product grid component(s)
- `src/pages/CategoryBrowser.tsx`

### 3. Defer non-critical global scripts on these pages
`FacebookPixelTracker`, `GoogleAnalyticsTracker`, `FloatingMusicPlayer`, and `FloatingPromotion` currently mount in the initial bundle from `App.tsx`. Wrap them in a `DeferredMount` that mounts after `requestIdleCallback` (fallback `setTimeout`). Trackers still fire well within analytics tolerance but stop blocking LCP/TBT on the landing pages.

### 4. Split the Category page below-the-fold strip
On `/category/:category`, only the filter bar + first product rows render eagerly. Filters' advanced panels, related-category strips, and the SEO/meta blocks load on scroll via the same `LazyOnVisible` wrapper.

## Out of scope (untouched)

- Product detail, checkout, account, orders, admin — kept as-is.
- Image format conversion (AVIF/WebP build pipeline) — separate effort.
- Backend / data fetching changes.

## Technical details

- New `src/components/perf/LazyOnVisible.tsx` — renders a reserved-height placeholder until the wrapper enters viewport (`rootMargin: 300px`), then mounts children. CLS-safe via required `minHeight`.
- New `src/components/perf/DeferredMount.tsx` — `requestIdleCallback` (fallback `setTimeout(0)`) mount; used in `App.tsx` for trackers + floating widgets.
- `Index.tsx`: wrap below-fold `<Suspense>` blocks in `<LazyOnVisible>`.
- Category pages: same wrapper around non-critical sections; image attribute pass on product cards.
- App.tsx: convert trackers/floating widgets to `lazy()` + `<DeferredMount>`.

## Expected impact on Home, Category, Subcategory

- **LCP**: faster — fewer images and scripts compete with the hero.
- **TBT / INP**: lower — tracker JS deferred past first paint.
- **Initial JS bytes**: smaller — below-fold section chunks load only on scroll.
- **CLS**: unchanged — placeholders reserve height.
