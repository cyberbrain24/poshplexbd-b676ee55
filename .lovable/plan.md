
## Goal
Make the **first page paint under ~1 second** on any URL — even cold first visit, even on 4G — by shipping a minimal shell instantly, then streaming data and visuals in progressively.

## The 3 problems we have today
1. **Index page is eagerly bundled** into the main JS, so users landing on `/category/...` or `/product/...` still download Home page code before their actual route loads.
2. **No skeletons** — most pages show a blank screen or spinner until the first data query resolves (~500–2000 ms).
3. **No route-aware preloading** — the browser only discovers it needs the route chunk *after* React mounts and matches the URL.

## Solution — three layers, deployed together

### Layer 1: Minimal critical shell (instant paint)
- Make **every route lazy**, including `Index`. The main bundle becomes just: providers + router + Suspense + a static `<AppShell />` (logo + announcement bar + empty `<main>`).
- Inline **critical CSS** for the shell (header, font sizing, background) directly into `index.html` `<style>`. Removes 1 stylesheet round-trip.
- Show a **branded skeleton inside `index.html`** that React replaces on hydration — visible *before* JS even parses.

Expected paint time: ~200–400 ms on 4G.

### Layer 2: Route-aware module preload (chunk-on-arrival)
- Add a tiny inline script in `index.html` that runs **before** the main bundle:
  ```js
  // Map URL pattern → chunk filename and inject <link rel="modulepreload">
  ```
- Vite emits stable chunk names; we generate the URL→chunk map at build time via a small Vite plugin and serialize it into `index.html`. The browser starts downloading the route chunk in parallel with the main bundle.
- Add `<link rel="preconnect">` for the image CDN (already done for Supabase) and a per-route `<link rel="preload" as="image">` for the LCP hero (e.g., home hero image URL injected by the same plugin).

Expected: route chunk arrives ~200 ms earlier on cold visits.

### Layer 3: Progressive data hydration (no blank screens)
- Every page renders its **skeleton immediately** (layout boxes, gradient shimmer) using current Tailwind classes. Replace today's `<LoadingFallback />` spinner with route-specific skeletons:
  - Home → hero box + 3 category tiles + product grid skeleton
  - Category → header strip + 8 product card skeletons
  - Product → image box + title bar + price + CTA skeleton
  - Account → tab + 3 card skeletons
- Wrap data hooks with React Query `placeholderData: keepPreviousData` so re-visits paint instantly.
- Add a **persisted query cache** (localStorage, 24h TTL) via `@tanstack/query-sync-storage-persister` so returning visitors see *real* data instantly while a background refetch runs.
- Defer all non-critical effects (analytics, music player, promo popups) until **after** first interactive — already done via `DeferredMount`, keep.

Expected: zero blank states. Skeleton → data swap happens during natural saccade, perceived as instant.

## Specific changes

### Files
1. **`vite.config.ts`** — add a small plugin that:
   - Reads the route table from `src/App.tsx`
   - Emits a `routeChunkMap` JSON injected into `index.html` as `<script id="route-chunk-map" type="application/json">`
   - Adds stable chunk filenames via `build.rollupOptions.output.chunkFileNames`

2. **`index.html`** — add:
   - Inlined critical CSS (~2 KB) for header/announcement/background
   - Inline shell HTML inside `<div id="root">` (skeleton header + main placeholder)
   - Inline preload script that reads `routeChunkMap` and injects `<link rel="modulepreload">` + LCP `<link rel="preload" as="image">`

3. **`src/App.tsx`** — convert `Index` and `NotFound` from eager to `lazy()`. Move shared providers into a tiny `<AppShell />` component that wraps `<Routes>`.

4. **`src/components/skeletons/`** — new folder. Add one skeleton component per top-level route:
   - `HomeSkeleton.tsx`
   - `CategorySkeleton.tsx`
   - `ProductDetailSkeleton.tsx`
   - `AccountSkeleton.tsx`
   - `GenericSkeleton.tsx` (fallback)
   Each uses Tailwind `animate-pulse` boxes mirroring real layout. Route-level `<Suspense fallback={...}>` uses the matching skeleton.

5. **`src/main.tsx`** — wire up `persistQueryClient` with localStorage persister (`@tanstack/query-sync-storage-persister` + `@tanstack/react-query-persist-client`, ~3 KB gzipped).

6. **Per-page data hooks** — set `placeholderData: keepPreviousData` on `useCategories`, `useHomepageProducts`, `useFeaturedProducts`, `useOptimizedCategoryProducts`.

## What stays out of scope
- Server-side rendering (would require migrating off Vite SPA — big lift, separate decision)
- Static prerendering (vite-ssg) — possible later phase but adds build complexity
- Service worker / offline caching — separate request
- Image format changes (already on WebP via existing pipeline)

## Risk & verification
- The route-chunk-map plugin must keep chunk filenames stable; we'll verify with a build diff.
- The inline skeleton in `index.html` must match the React shell exactly to avoid hydration flash — we'll keep it visually neutral (just header bar + gray boxes).
- Persisted cache could serve stale data — 24 h TTL + background refetch + `staleTime: 5min` keeps it safe.
- Test cold-visit timing on `/`, `/category/fifa-edition`, and `/product/...` using Chrome DevTools throttled to "Slow 4G". Target: first paint ≤ 600 ms, LCP ≤ 1.5 s, interactive ≤ 2.5 s.

## Expected outcome
| Metric | Today (estimate) | After |
|---|---|---|
| First Paint (cold, 4G) | 1.2–2.0 s | **0.3–0.5 s** |
| LCP (cold, 4G) | 2.5–4.0 s | **1.2–1.8 s** |
| Time to interactive | 3.5–5.0 s | **2.0–2.8 s** |
| Repeat visit first paint | 0.8 s | **<0.1 s** (skeleton + persisted cache) |
