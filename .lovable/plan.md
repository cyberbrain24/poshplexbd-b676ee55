
# Performance Fixes — Safety-First

Goal: cut FCP from ~6s to ~2s, CLS from 0.25 to <0.1, without changing any business logic, Pixel events, CAPI events, or visitor analytics.

## Will this break anything?

**No.** Each change is non-breaking by design:

| Fix | What changes | What does NOT change |
|---|---|---|
| Defer Facebook Pixel | Loads ~1–2s later (after first paint or first interaction) | Same Pixel ID, same events (PageView, ViewContent, AddToCart, Purchase), same dedup with CAPI |
| Defer `track-visit` | Fires after page is interactive | Same visitor row written, same analytics data |
| Defer `meta-capi` PageView | Fires from idle callback | Same event payload, same server-side delivery |
| Reserve hero/section heights (CLS) | Adds `min-height` / `aspect-ratio` placeholders | No visual change once loaded |
| Lazy-load `This_is_Fire.ttf` | Font swaps in after text paints | Same font on same elements |
| Deep-import lucide icons | Smaller JS bundle | Same icons render |
| Add `<link rel="preconnect">` | Browser warms DNS/TLS earlier | No functional change |

Pixel + CAPI keep firing the **exact same events with the same parameters** — we are only delaying the script load by ~1–2 seconds, which Meta explicitly supports (the SDK queues calls made before init).

---

## Scope of changes

### 1. Fix CLS (the visible jank)
- `src/components/home/HeroSection.tsx` — already has `aspect-[3/1] md:aspect-[4/1]` skeleton; verify it actually reserves space before branding loads (currently it short-circuits to `null` while branding is loading → causes shift).
- Reserve min-height on `CategorySection` and `FeaturedProducts` Suspense fallbacks (already partially there, tune values).

### 2. Defer tracking off the critical path
- `src/components/tracking/FacebookPixelTracker.tsx` — wrap script injection in `requestIdleCallback` (fallback `setTimeout(…, 2000)`) or fire on first user interaction. Queue any early `fbq(...)` calls so no events are lost.
- `src/components/tracking/VisitorTracker.tsx` — move the `track-visit` fetch into `requestIdleCallback`.
- Meta CAPI PageView call — same idle-defer treatment.

### 3. Font optimization
- `index.css` / wherever `This_is_Fire` is declared — add `font-display: swap` and `unicode-range` if applicable. Consider preloading only when the slogan is actually on screen.

### 4. Lucide-react bundle
- Audit imports; replace barrel `import { X, Y } from "lucide-react"` with per-icon paths only where it matters (header, footer, product card). Low risk, mechanical change.

### 5. Preconnects in `index.html`
- Add: `https://zspmhkzosumopyfmlwvl.supabase.co`, `https://connect.facebook.net`, `https://www.facebook.com`.

### 6. DOM trim (optional, lower priority)
- Marquee announcement bar duplicates content for scroll — cap copies. Mega menu pre-renders all panels — render lazily on hover.

---

## Out of scope (not touching)
- Pixel ID, event names, parameters, dedup logic
- CAPI edge function `meta-capi`
- Visitor analytics schema or `track-visit` payload
- Product/order/checkout logic
- Admin panel
- Any database changes

---

## Verification steps after build
1. Open DevTools → Network → filter `facebook` → confirm `fbevents.js` still loads and `PageView` still fires.
2. Open Meta Events Manager → Test Events → confirm PageView arrives from both browser and server (CAPI) with matching `event_id`.
3. Re-run performance profile → expect FCP ~2s, CLS <0.1.
4. Check `/admin/marketing/visitor-analytics` → new visit row recorded for the test session.

---

## Rollout order
1. Preconnects + CLS reserves (lowest risk, instant win)
2. Defer Pixel + CAPI + visitor tracking
3. Font `font-display: swap`
4. Lucide deep imports
5. (Optional) DOM trim

Each step is independently revertible.
