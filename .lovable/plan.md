## Goal

Adopt the typography spec from `typography-system.md` as a dynamic, admin-controlled system. The admin can change every token (family, size desktop/mobile, weight, line-height, letter-spacing, transform) from Site Settings, and the storefront updates instantly. Admin panel stays unaffected (current `.admin-shell` exclusion preserved).

## Token model (17 tokens, 2 family slots)

Family slots (admin picks any font from existing `FONT_CATALOG`):
- `serif` — display/editorial role (default: Playfair Display)
- `sans` — UI/functional role (default: Inter)

Tokens (each: family slot, size desktop, size mobile, weight, line-height, letter-spacing, transform):
`display, h1, h2, h3, product-title-card, product-title-pdp, price, price-sale, price-original, body, body-small, label, button, nav-link, badge, logo, caption`

Defaults exactly match the spec table (sizes, weights, leading, tracking, casing).

## Changes

### 1. Spec source — `src/lib/typographyTokens.ts` (new)
- Export `TYPO_TOKENS` list, `TypographyToken` type, `TokenConfig` type, `TYPO_DEFAULTS` (the full spec table), and `FAMILY_SLOTS = ['serif','sans']` with defaults `Playfair Display` / `Inter`.
- Add `Playfair Display`, `Cormorant Garamond`, `Jost`, `Work Sans` to `src/lib/fontCatalog.ts` (Google fonts).

### 2. Runtime — `src/components/TypographyProvider.tsx` (rewrite)
- Read `site_settings.typography` (shape: `{ families: { serif, sans }, tokens: { [token]: TokenConfig } }`).
- Lazy-inject Google font links for the two family slots only (weights 400/500/600).
- Inject one `<style id="dynamic-typography">` block containing:
  - `:root { --font-serif, --font-sans, --fs-<token>, --lh-<token>, --ls-<token>, --fw-<token>, --tt-<token> }` (desktop values).
  - `@media (max-width: 767px) { :root { --fs-<token>: mobile values } }`.
  - Utility classes scoped with `:not(.admin-shell):not(.admin-shell *)`:  
    `.t-display`, `.t-h1`, `.t-h2`, `.t-h3`, `.t-product-card`, `.t-product-pdp`, `.t-price`, `.t-price-sale`, `.t-price-original`, `.t-body`, `.t-body-small`, `.t-label`, `.t-button`, `.t-nav-link`, `.t-badge`, `.t-logo`, `.t-caption`.
  - Element-level mapping (so existing components without `.t-*` classes still pick up the spec):  
    `h1{...token h1}`, `h2{...h2}`, `h3{...h3}`, `nav a, nav button{...nav-link}`, `body{...body}` — all scoped with the existing `.admin-shell` exclusion.
- Backwards-compat: if `site_settings.typography` is in the old shape (`{h1,h2,...,body,nav}`), map it once into the new shape on read; never overwrite the DB silently — only admin save persists the new shape.

### 3. Admin UI — `src/components/admin/TypographySettings.tsx` (rewrite)
Sections:
1. **Font families** — two `Select`s (Serif slot, Sans slot) sourced from `FONT_CATALOG`. Live preview line for each.
2. **Tokens** — collapsible groups matching the spec's Location Mapping:
   - Global / chrome: `logo, nav-link, caption`
   - Headings: `display, h1, h2, h3`
   - Product grid: `product-title-card, price, badge`
   - Product detail: `product-title-pdp, price-sale, price-original, body, label, button`
   - Generic: `body-small`
   Each token row has: family slot (Serif/Sans toggle), weight (300–800), size desktop (px input 10–80), size mobile (px input 10–80), line-height (0.9–2 step 0.05), letter-spacing (px input -2 to 8), transform (none/uppercase/lowercase/capitalize), and a live preview using the in-form values.
3. **Footer actions** — `Reset to spec defaults`, `Save & Apply`.
- Saves to `site_settings.typography` and invalidates `site-typography` query for instant apply.
- A "Where this appears" hint under each token lists locations from the spec.

### 4. Component adoption (light pass — non-breaking)
Most storefront text already uses `h1/h2/h3/nav/body`, which the element-level CSS in the provider covers. Add explicit `.t-*` classes only where headings don't carry the semantic tag:
- `src/components/header/PoshplexHeader.tsx` — logo wordmark → `t-logo`; nav links already in `<nav>`.
- `src/components/footer/PoshplexFooter.tsx` — column titles → `t-h3`, links → `t-body-small`, copyright → `t-caption`.
- `src/components/home/ProductGrid.tsx` + `FeaturedProducts.tsx` product card name → `t-product-card`, price → `t-price`, badges → `t-badge`.
- `src/pages/ProductDetail.tsx` / `ProductInfo.tsx` — title → `t-product-pdp`, current price → `t-price`, sale → `t-price-sale`, original → `t-price-original`, description → `t-body`, size/color labels → `t-label`, Add-to-cart → `t-button`.
- `src/components/header/AnnouncementBar.tsx` — `t-caption`.
- `src/components/category/CategoryHeader.tsx` breadcrumbs → `t-caption`.

No business logic, no DB schema migration (the `typography` jsonb column already exists). Admin panel keeps its existing reset (`.admin-shell` rules in `index.css`).

### 5. Cleanup
- Keep `fontCatalog.ts` (extended with new fonts). Old `TYPOGRAPHY_DEFAULTS` / `TypographyConfig` types stay exported temporarily for the legacy-shape mapper, then deleted once not referenced.
- `index.css` heading size rules left as the bare minimum fallback for first paint before the provider mounts.

## Technical notes

- Storage shape (jsonb):  
  `{ families: { serif: "Playfair Display", sans: "Inter" }, tokens: { h1: { slot: "serif", weightDesktop: 400, weightMobile: 400, sizeDesktop: 32, sizeMobile: 26, lineHeight: 1.1, letterSpacing: 0, transform: "none" }, ... } }`.
- Mobile breakpoint: `max-width: 767px` (matches existing Tailwind `md`).
- All injected CSS uses `!important` on the scoped selectors (matches current provider behavior) so Tailwind utilities can still override when intentionally used on inline elements.
- No new packages; uses existing `@tanstack/react-query`, `sonner`, shadcn `Select/Slider/Switch/Input/Label/Button`.

## Out of scope

- No changes to `.admin-shell` rules or admin fonts.
- No new DB migration (reusing `site_settings.typography` jsonb).
- No automatic refactor of every component — only the targeted adoption list above.
