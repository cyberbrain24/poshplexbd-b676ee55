## Why `/category/fifa-collection` feels slow

I loaded the live page and profiled it. The slowness is not one bug — it is several small things stacking up. Concrete numbers below.

### Measured

- **TTFB**: 1636 ms (just to get the HTML)
- **FCP**: 2664 ms, full load: 2238 ms
- **18 parallel Supabase calls** fire on load; each one takes **500–760 ms** in the user's region (a single empty REST call already takes ~600 ms)
- **2 edge functions block early**: `meta-capi` 1538 ms, `track-visit` 2055 ms
- A **16.7 s background MP3** is downloaded eagerly by the floating music player
- Product images are **~2 seconds each**, served as raw 500 KB+ JPEGs from storage with no resizing
- Slowest DB query (from `pg_stat_statements`): the products fetch with `*` plus joins to category/brand/size_guide/care_instruction/images/variants(+color+size+material) — **mean 438 ms, max 982 ms** over 218 calls. ProductDetail uses the `*` shape.
- The category list itself runs a **6-step sequential waterfall** before the first product appears.

### Top causes, in order of impact

**1. Sequential request waterfall in `useOptimizedCategoryProducts` (`src/hooks/useOptimizedProducts.ts`)**
For a category slug it runs, one after the other:

```text
categories (lookup parent by name) ─► categories (active subcategories)
        ─► product_categories (junction filter) ─► products + count + reviews
```

That is 4 round-trips × ~600 ms = ~2.4 s before any card paints.

**2. `track-visit` and `meta-capi` edge functions block on the same network as the data calls**
Together they hold ~3.5 s of bandwidth/connections during the most important moment. They should be deferred to `requestIdleCallback` after first paint, or fired with `keepalive: true` without being awaited.

**3. The floating music player eagerly downloads the full MP3** (`MusicPlayerContext.tsx` sets `audioRef.current.preload = "auto"`). 16.7 s of audio = several MB on every page load. Switch to `preload="none"` (or `"metadata"`) and only load on user interaction.

**4. Eager fetches that are irrelevant to a category page**
On `/category/...` the app currently fetches: `colors`, `sizes`, `categories` (twice), `site_branding`, `site_settings.typography`, `get_public_site_settings` RPC, three separate `promotions` queries. Most of those belong to the filter sheet / footer / header and can be `useQuery({ enabled: open })` or lazy-loaded with the components that need them.

**5. The slow product DB query is over-fetching**
The 438 ms-average query selects `products.*` plus full rows from 4 reference tables and full variant rows joined to colors/sizes/materials. ProductDetail and some list paths use this shape. The category list itself already uses a slim shape — keep slim shape for lists, and trim the detail shape (only fields the UI reads).

**6. Unoptimized images**
Each card image is 2 s and the originals are uncompressed JPEGs. Memory says paid Supabase Image Transformation isn't available, so the practical fixes are: pre-compress on upload (already used elsewhere — make sure new uploads go through `imageCompress.ts`), serve a single product card image (not all gallery shots), and add `loading="lazy"` + `decoding="async"` + explicit width/height to grid `<img>` tags.

**7. Render-blocking Google Fonts**
`fonts.googleapis.com/css2?...` is loaded as a render-blocking `<link>`. Either self-host (project already has `.ttf` files) or load with `media="print" onload="this.media='all'"` so it stops blocking FCP.

### Plan

When you switch to build mode, I'll do this in one pass — every change is small and isolated, no schema or RLS work.

1. **`src/hooks/useOptimizedProducts.ts`**
   - Run parent-category lookup, active-subcategory lookup, and product_categories junction in parallel where possible.
   - Cache the parent-category-id lookup with its own `useQuery(["category-by-slug", slug])` so it isn't re-run inside `queryFn` and survives navigation.
   - Drop `variants:product_variants(...)` from the list query — the grid only needs `base_price` + main image. (Variant prices for "from ৳X" can be precomputed or fetched on hover.)

2. **`src/contexts/MusicPlayerContext.tsx`** — change `preload = "auto"` to `"none"`, set `src` only when the user clicks play.

3. **`src/components/tracking/VisitorTracker.tsx` / `FacebookPixelTracker.tsx`** — wrap the `track-visit` and `meta-capi` calls in `requestIdleCallback` (with a `setTimeout` fallback) so they don't run during the initial paint window.

4. **`src/components/category/FilterSortBar.tsx`** — make `colors` and `sizes` queries `enabled: filtersOpen`. They aren't needed until the user opens the filter sheet.

5. **`src/components/header/PoshplexHeader.tsx` / promo slots** — collapse the three `promotions` queries into one with an `in("placement", [...])` filter; gate non-header promotions behind their slot's intersection observer.

6. **`src/components/category/ProductGrid.tsx`** — add `loading="lazy"`, `decoding="async"`, and explicit width/height to card `<img>` tags so they don't compete for connections during FCP and don't cause layout work.

7. **`index.html`** — load the Google Fonts stylesheet non-blocking (`media="print" onload="this.media='all'"` + `<noscript>` fallback). Add `<link rel="preconnect" href="https://zspmhkzosumopyfmlwvl.supabase.co" crossorigin>` so the very first Supabase round-trip is faster.

### Out of scope
- No change to RLS, schema, or storage buckets.
- No paid image transform — handled with HTML hints + existing client-side compression on upload.
- No change to ProductDetail's data shape (separate concern; only relevant if you also report PDP slowness).

Expected outcome: time-to-first-product on this category should drop from ~2.5–3 s to well under 1 s on a warm cache, with FCP improving by ~600–900 ms thanks to deferring tracking + non-blocking fonts.
