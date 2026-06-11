# Promotional Ads & Banners Module

A reusable "Promotions" system that lets admins place visual ads/banners anywhere on the storefront. Clicking an ad opens a popup with details (promo code, product link, announcement, image, etc.).

## What you'll be able to do

- Create unlimited ads from a single admin page (`/admin/promotions`, also linked from the Promo Codes page).
- Each ad has: title, short label, image (optional), content type, target action, schedule (start/end), priority, active toggle, and placement slots.
- Click behavior options:
  - **Show popup** with rich content (description + optional promo code with copy button + CTA button)
  - **Link to product** (pick from product picker)
  - **Link to category / URL**
  - **No action** (informational only)
- Placement slots (multi-select per ad):
  - `home_top` — under hero
  - `home_middle` — between sections
  - `home_bottom` — above footer
  - `category_top` — top of category pages (optional category filter)
  - `product_top` / `product_bottom` — on product detail pages
  - `footer` — inside footer
  - `floating` — sticky floating bubble bottom-right (sitewide)
  - `announcement` — appended into the announcement bar rotation
- Display styles: `banner` (full-width image strip), `card` (compact card), `floating-bubble`, `inline-text`.
- Scheduling: only render between `starts_at` and `ends_at`; respect `is_active`.
- Dismissible: optional "X" close, remembered in localStorage per ad ID.

## Technical details

**Database** — single new table `public.promotions`:
- `id`, `title`, `subtitle`, `description`, `image_url`, `display_style`, `action_type` (`popup` | `product` | `category` | `url` | `none`), `action_value` (uuid/url), `promo_code_id` (fk → promo_codes, nullable), `placements` (text[]), `category_filter` (uuid[] nullable, for category_top), `priority` (int), `is_active` (bool), `dismissible` (bool), `starts_at`, `ends_at`, `clicks` (int), `views` (int), `created_at`, `updated_at`.
- GRANT SELECT to `anon` + `authenticated` (public reads filtered by active/schedule), full CRUD to `service_role`, admin-only writes via RLS using `is_admin()`.
- Increment-counter RPCs: `increment_promotion_view(uuid)`, `increment_promotion_click(uuid)` (SECURITY DEFINER).

**Frontend**
- New hook `usePromotions(placement, opts?)` → cached query (5min) filtering active + within schedule, sorted by priority.
- New components in `src/components/promotions/`:
  - `PromotionSlot.tsx` — generic renderer taking a placement key; fetches and renders all matching ads in chosen display style.
  - `PromotionCard.tsx` — visual card/banner.
  - `PromotionPopup.tsx` — dialog with details, promo code copy-to-clipboard, CTA.
  - `FloatingPromotion.tsx` — sticky bubble.
  - `PromotionDismiss.ts` — localStorage helper.
- Insert `<PromotionSlot placement="..." />` into:
  - `pages/Index.tsx` (home_top, home_middle, home_bottom)
  - `pages/Category.tsx` (category_top)
  - `pages/ProductDetail.tsx` (product_top, product_bottom)
  - `components/footer/PoshplexFooter.tsx` (footer)
  - `App.tsx` (floating — sitewide, excluded on /admin)
  - `components/header/AnnouncementBar.tsx` (announcement — rotate text-only promos)

**Admin UI**
- New page `src/pages/admin/AdminPromotions.tsx` registered at `/admin/promotions`.
- Sidebar entry under Marketing group.
- List view: thumbnail, title, placements (chips), schedule, status toggle, clicks/views, edit/delete.
- Modal `PromotionModal.tsx`: title, subtitle, description (textarea), image upload (reuses media bucket), display style select, action type + dynamic field (product picker / category picker / URL / promo code select), placements multi-select, optional category filter, schedule dates, priority, dismissible, active.
- Quick link button on `AdminPromoCodes.tsx`: "Create Ad for this code" → opens promotion modal pre-filled.

**Out of scope**
- A/B testing, targeting by user segment, paid impressions, analytics dashboards (basic click/view counters only).
- Admin UI/typography unaffected (`.admin-shell` already isolates).
- No changes to existing promo_codes logic — promotions only *reference* a promo code for display.
