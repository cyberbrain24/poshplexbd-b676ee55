# First-Visit Speed Optimization Plan

Goal: make the **very first paint** on home and category pages as fast as possible (better LCP, FCP, TBT in Google PageSpeed) for users who land cold with no cache.

Cache-lifetime headers are skipped here on purpose — they only help repeat visitors.

## What we'll do

### 1. Preload the LCP image (homepage hero)
The hero banner is the Largest Contentful Paint element on the homepage. Currently the browser only discovers it after parsing React. We'll add a `<link rel="preload" as="image" fetchpriority="high">` in `index.html` so the browser starts downloading it immediately in parallel with the JS bundle.

Result: ~300–800ms faster LCP on mobile.

### 2. Mark hero `<img>` with `fetchpriority="high"` and remove `loading="lazy"` from above-the-fold images
The hero and the first row of category/product tiles are above the fold. They must NOT be lazy-loaded — that delays LCP. We'll audit `Hero`, `FeaturedProducts`, `ProductGrid`, and category grid to ensure:
- LCP image: `fetchpriority="high"`, eager
- First ~4 product tiles: eager
- Everything else: `loading="lazy"` (already done)

### 3. Code-split heavy non-critical components on home & category pages
Defer JS that isn't needed for the first paint:
- Footer, Mobile Hamburger menu, Chatbot widget, Reviews, "Our Story" section → `React.lazy` + Suspense
- Mega menu dropdown panels → load on hover/open, not on mount
- Meta Pixel / GA4 scripts → already deferred, verify they load `after` interactive

This reduces the initial JS bundle parsed/executed before first paint.

### 4. Preconnect to critical third parties
Add `<link rel="preconnect">` in `index.html` for:
- Supabase storage (image CDN host)
- Google Fonts (if used)

Saves the DNS+TLS handshake on the first image/font request (~100–300ms).

### 5. Inline critical font-face + `font-display: swap`
Ensure no invisible-text flash and no render-blocking font request. Use `font-display: swap` on all `@font-face` and preload only the one weight used above the fold.

### 6. Verify with PageSpeed
Run `browser--performance_profile` against home and a category page before/after to confirm LCP, FCP, and TBT improvements.

## Scope (only these pages)
- `/` (Index / home)
- `/category/*` and subcategory routes

Other routes (admin, account, checkout) are untouched.

## Files likely to change
- `index.html` (preload, preconnect, font-display)
- `src/components/home/Hero.tsx` (fetchpriority, eager)
- `src/components/home/FeaturedProducts.tsx`, `ProductGrid.tsx` (first-N eager)
- `src/components/category/ProductGrid.tsx` (first-N eager)
- `src/pages/Index.tsx` (lazy-load below-the-fold sections)
- `src/App.tsx` (lazy-load Footer / Chatbot already partially done — verify)

## What you'll see in PageSpeed
- LCP: meaningful drop (target <2.5s on mobile)
- FCP: small improvement
- "Largest Contentful Paint image was lazily loaded" warning: gone
- "Preconnect to required origins": gone
- Total Blocking Time: lower from smaller initial JS

## Out of scope
- Cache-Control headers (server-side, doesn't help first visit)
- Image format conversion to AVIF/WebP at the CDN (Supabase paid feature, per your constraints)
- Admin / account / checkout routes
