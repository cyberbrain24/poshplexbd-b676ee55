
## Goal

Restore fast first-paint on mobile (BD 3G/4G) across all storefront pages, especially the homepage. No business-logic changes, only presentation / data-fetch / asset optimizations.

## What's actually slow (verified from code + live network trace)

1. **Preload cache is being bypassed.** `index.html` preloads:
   - `categories?select=id,name,image_url,parent_id&order=name`
   - `site_settings?select=id,typography,...&limit=1`
   
   But the app then re-requests:
   - `categories?select=*&order=sort_order.asc` (seen in network log — different columns/order, so the preloaded promise is discarded)
   - `site_settings` from multiple hooks with mismatched columns
   
   Result: the "early preload" trick isn't helping — the browser still waits for a second round-trip after the JS bundle boots.

2. **Hero image preload is late.** `HeroSection` injects `<link rel=preload>` via `react-helmet-async` only after React mounts AND `site_branding` query resolves. On 3G that's easily 1.5–2 s after HTML arrives, so LCP starts late.

3. **`site_branding` is not in the early preload script** — only `branding` key is used but never wired to the hero preload chain.

4. **No repeat-visit cache.** React Query resets on every full reload; repeat visitors re-fetch branding / categories / settings even though nothing changed.

5. **Category thumbnails** are served at full webp size (no responsive `srcset`) — heavy on mobile.

6. **Meta Pixel** currently force-injects on `/checkout` mount (correct), but on all other pages it still loads early via the tracker — verify it's `defer`/idle-loaded so it doesn't compete with LCP.

## Fix plan (small, surgical)

### 1. Make the early preload actually match the real queries
- Update `index.html` preload script to fetch **the same shapes** the hooks request:
  - `site_branding?select=*` (already listed; ensure key name matches)
  - `categories?select=*&order=sort_order.asc` (match `useCategories`)
  - `site_settings?select=*&limit=1` (broader, one row anyway)
- Update `useSiteBranding`, `useCategories`, `useSiteSettings` to consume `window.__ppPreload.*` first (branding already does; extend the same pattern to the two others where missing).

### 2. Preload the hero image from HTML, not from React
- In the same early script, after `branding` resolves, inject a `<link rel="preload" as="image" fetchpriority="high" href="...">` for the correct desktop/mobile hero URL based on `matchMedia("(min-width: 768px)")`.
- Remove the Helmet-based preload in `HeroSection.tsx` (it fires too late).

### 3. Persist React Query cache across reloads
- Add `@tanstack/query-sync-storage-persister` + `persistQueryClient` (localStorage, ~1 MB budget, 24 h max age) wired in `src/main.tsx`.
- Whitelist only long-lived keys: `site-branding`, `categories`, `site-settings`, `featured-products`, `homepage-products`.
- Repeat visits paint instantly from cache while a background revalidation runs.

### 4. Responsive category thumbnails
- `CategorySection` and mega-menu already use uploaded webp originals. Add `sizes` + width-based `srcset` using the existing `imageThumbs.ts` variants (Small 300, Medium 600). Mobile downloads ~300 px assets instead of full-size.

### 5. Defer Meta Pixel on non-checkout pages
- Audit `FacebookPixelTracker` to ensure the pixel `<script>` is injected via `requestIdleCallback` (or after `load`) on non-checkout routes, so it never competes with LCP. Keep the existing `forceInjectPixel` on `/checkout`.

### 6. Cheap wins
- Add `Cache-Control: public, max-age=300, stale-while-revalidate=86400` hint by moving these three read-only endpoints behind a lightweight edge function OR by relying on the persisted cache (step 3). Prefer step 3 — no new function.
- Trim the Google Fonts CSS to only the weights actually rendered on mobile (currently 5 Poppins weights load on tablet+; desktop still fine).

## Out of scope
- No changes to checkout / order / auth / pixel event logic.
- No layout / visual changes.
- No admin bundle changes (already lazy-loaded).

## Verification
- Run Lighthouse mobile (Slow 4G / 4× CPU) on `/`, `/category/upper-wear`, `/product/*` before and after.
- Target: LCP < 2.5 s on repeat visits, < 3.5 s on first visit; JS transferred < 250 KB on landing.
- Confirm the "categories" and "site_settings" requests in the network waterfall drop from 2 to 1 (preload consumed) on first visit and to 0 on repeat visits.

## Technical details
- Files touched: `index.html`, `src/main.tsx`, `src/hooks/useSiteBranding.ts` (already partly done), `src/hooks/useCategories.ts`, `src/hooks/useSiteSettings.ts`, `src/components/home/HeroSection.tsx`, `src/components/home/CategorySection.tsx`, `src/components/tracking/FacebookPixelTracker.tsx`, `src/components/nav/MegaMenu*.tsx` (srcset only).
- Packages added: `@tanstack/react-query-persist-client`, `@tanstack/query-sync-storage-persister`.
- No DB migrations, no edge function changes, no env changes.
