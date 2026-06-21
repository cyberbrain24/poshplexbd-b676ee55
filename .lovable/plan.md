Goal: Break the critical request chain that causes a 3,671 ms maximum critical-path latency on the homepage.

### Problems identified

1. **Google Fonts CSS blocks first render** — `src/index.css` uses `@import url('https://fonts.googleapis.com/...')`. The browser must download the CSS bundle, parse it, discover the `@import`, then fetch the Google Fonts CSS, then fetch the woff2 files. This creates a 3-link blocking chain.

2. **Meta CAPI edge function is on the critical path** — `trackPageView()` fires a server-side `meta-capi` edge-function call on every route change, including the initial homepage load. The screenshot shows this call alone takes **3,671 ms**, making it the single longest request in the chain.

3. **Too many parallel promotion API calls** — Each `<PromotionSlot>` fetches promotions separately by placement. The screenshot shows 5–6 separate `promotions?select=...` requests hitting Supabase at once.

### Fixes

#### 1. Move Google Fonts out of CSS and into `index.html`
- Remove the `@import` line from `src/index.css`.
- Add the font stylesheet as a standard `<link>` in `index.html` inside `<head>`.
- Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` (the actual font files are served from `gstatic.com`, not `googleapis.com`).
- Keep the existing `preconnect` to `fonts.googleapis.com`.

This shortens the chain because the browser discovers the font CSS immediately while parsing the HTML, instead of waiting for the CSS bundle to download and parse first.

#### 2. Defer Meta CAPI `PageView` on initial load
- In `src/services/facebook-pixel.service.ts`, modify `trackPageView()` so the **first** `PageView` on a fresh page load only fires the browser `fbq` event and skips the server-side `sendCapi` mirror.
- Keep `sendCapi` for subsequent SPA navigations and for higher-value events (`AddToCart`, `Purchase`, etc.).
- This removes the 3.6 s `meta-capi` request from the initial critical path entirely.

#### 3. Combine promotion fetches into one call
- Refactor the promotions hook so the homepage makes a **single** `promotions?select=...` call that fetches all active promotions, then filters by placement client-side.
- Update `<PromotionSlot>` to consume from this shared cache instead of issuing its own query per placement.
- This replaces 5–6 parallel Supabase requests with 1 request, freeing HTTP connections for the other critical data fetches (products, reviews, categories).

### What will NOT change
- The product, review, category, and branding API calls are already as parallel as possible and are needed for homepage content. They will remain, but with fewer promotion requests competing for connections they should complete faster.
- The main JS bundle size will not be reduced in this pass (that requires deeper bundle analysis).

### Verification
After the changes, re-run Lighthouse/PageSpeed Insights and confirm:
- The Google Fonts chain is no longer flagged as a critical request chain.
- The `meta-capi` request no longer appears in the initial critical path.
- The number of `promotions` requests on initial load is reduced to 1.