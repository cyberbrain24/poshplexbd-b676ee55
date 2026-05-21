# Tracking & Marketing — Advanced Module

Promote the current "Tracking & Marketing" section in Site Settings into a first-class, expandable admin module with its own sidebar group, dedicated routes, and a richer multi-tab UI per channel.

## New sidebar group

Add a collapsible "Marketing & Tracking" group to `AdminSidebar.tsx` (icon: `Megaphone` or `LineChart`) with sub-items:

- **Overview** → `/admin/marketing` — status dashboard of every connected channel (Pixel, CAPI, GA4) with health badges (Configured / Live / Disabled / Missing token), last event sent, and quick-toggle switches.
- **Meta Pixel** → `/admin/marketing/meta-pixel` — Pixel ID, Enable, Test Mode, Advanced Matching, E-commerce Events, event-by-event toggles (PageView, ViewContent, AddToCart, InitiateCheckout, Purchase, Search, AddToWishlist, CompleteRegistration), "Send Test Event" button.
- **Meta CAPI** → `/admin/marketing/meta-capi` — Access Token (masked, show/hide), Test Event Code, Dataset/Pixel ID confirmation, deduplication info, "Send Server Test Event" button that hits the existing `meta-capi` edge function, last 10 delivery logs.
- **Google Analytics 4** → `/admin/marketing/ga4` — Measurement ID, Enable toggle, Enhanced Measurement note, validation of `G-XXXXXXXX` format, test ping.
- **(Future-ready) TikTok Pixel & Google Ads** → placeholder cards marked "Coming soon" so the module is visibly extensible.

The existing Site Settings "Tracking & Marketing" section is removed; the Overview page replaces it.

## Pages & components

Create under `src/pages/admin/marketing/`:
- `MarketingOverview.tsx`
- `MetaPixelSettings.tsx`
- `MetaCapiSettings.tsx`
- `GA4Settings.tsx`
- `MarketingLayout.tsx` — wraps children with a sub-nav tab strip (mirrors the sidebar sub-items) so users can switch within the module.

Shared building blocks in `src/components/admin/marketing/`:
- `ChannelStatusCard.tsx` — channel name, status pill, key field summary, toggle.
- `MaskedTokenInput.tsx` — password input with show/hide and copy.
- `TestEventButton.tsx` — fires a sample event and surfaces the response.

## Data & wiring

- Reuse `usePixelSettings` / `useUpdatePixelSettings` (`src/hooks/usePixelSettings.ts`) — no schema change required; all fields already exist (`meta_pixel_id`, `meta_pixel_enabled`, `meta_test_mode`, `meta_advanced_matching`, `meta_ecommerce_events_enabled`, `meta_capi_enabled`, `meta_capi_access_token`, `ga4_enabled`, `ga4_measurement_id`).
- Each subpage scopes its mutation to only its own fields (partial update) so saves are independent per channel.
- Overview page reads the same hook and derives status badges client-side.

## Routing

Register routes in `src/App.tsx` (or wherever admin routes live) lazily, and add them to `src/lib/adminRoutePrefetch.ts` so the prefetch idle-loop covers them.

## Sidebar implementation detail

Extend `AdminSidebar.tsx`:
- Add `marketingItems: NavItem[]` array.
- Add `'marketing'` to the `GroupKey` union and `getInitialOpen` logic.
- Insert `renderCollapsible(Megaphone, "Marketing & Tracking", marketingItems, ...)` between "Order Management" and "Customer Management".

## Out of scope

- No new DB columns, no new edge functions (existing `meta-capi` is reused).
- No changes to the storefront pixel firing logic (`useFacebookPixel`, `facebook-pixel.service.ts`).
- Other Site Settings sections (branding, AI credentials, etc.) stay where they are.

Approve to implement.
