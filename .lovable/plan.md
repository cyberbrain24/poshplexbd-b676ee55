
# Instagram DM & Messenger Marketing (Superlight)

Two new sibling modules mirroring the WhatsApp Marketing shape. Fully isolated, prefixed tables, lazy routes, admin-only RLS. Zero edits to storefront, checkout, orders, SMS, Email, or WhatsApp modules.

## Guiding rules

- Provider-agnostic HTTP config (Meta Graph API by default; works with ManyChat, Chatfox, etc.).
- Both modules built from the same template — separate tables, separate routes, separate edge functions, separate sidebar entries.
- v1 = templates + bulk send + history + opt-out. No inbound webhook, no auto-firing, no 24h-window enforcement logic beyond a warning banner.
- Meta policy reminder shown in UI: Instagram/Messenger only allow marketing messages inside the 24-hour user-initiated window or via approved tags/recurring notifications.

## What ships in v1

### Sidebar (under Marketing group)
- "Instagram DM" → `/admin/instagram-marketing` (icon: `Instagram`)
- "Messenger" → `/admin/messenger-marketing` (icon: `MessagesSquare`)

### Admin pages (mirror `AdminWhatsAppMarketing.tsx`)
Tabs each: Bulk Send · Auto Triggers · Provider Settings · Campaigns · History · Opt-outs

**Audience targeting** (both):
- Manual recipient list (IG usernames / PSIDs)
- Imported list (CSV paste)
- Saved subscriber list managed in module (simple table)
- Note: cannot reuse `customers` directly — Instagram/Messenger use IG-scoped IDs / PSIDs, not phone numbers.

**Fashion-commerce templates (seeded):**
- `new_drop_announcement`, `flash_sale`, `lookbook_share`, `back_in_stock`, `price_drop`
- `order_shipped`, `order_delivered` (post-purchase, within window)
- `review_request`, `winback_30d`, `birthday_offer`, `membership_welcome`
- `story_reply_followup`, `comment_reply_dm` (IG-specific)

### Compliance
- Suppression lists per channel (`ig_suppression`, `msgr_suppression`).
- Footer auto-appended: "Reply STOP to opt out."
- Public unsubscribe pages: `/instagram/unsubscribe?id=...`, `/messenger/unsubscribe?id=...`.
- Visible warning banner about Meta 24-hour messaging window.

### Database — two parallel sets of 5 tables

Instagram: `ig_provider_settings`, `ig_templates`, `ig_campaigns`, `ig_messages`, `ig_suppression`, plus `ig_subscribers` (id, ig_id, username, name, opted_in, source).

Messenger: `msgr_provider_settings`, `msgr_templates`, `msgr_campaigns`, `msgr_messages`, `msgr_suppression`, plus `msgr_subscribers` (id, psid, page_id, name, opted_in, source).

All tables: GRANT to `authenticated` + `service_role`, RLS admin-only. Suppression tables get anon `INSERT` only for public unsubscribe.

### Edge functions
- `instagram-marketing-send` — mirrors `whatsapp-marketing-send`. Actions: `bulk` | `single` | `test`. Substitutes `{to}`, `{body}`, `{media_url}`, `{access_token}`, `{ig_user_id}` into provider JSON. Logs each result.
- `messenger-marketing-send` — same shape. Placeholders: `{to_psid}`, `{body}`, `{media_url}`, `{access_token}`, `{page_id}`, plus `messaging_type` and `tag` fields in settings.

Uses existing `_shared/cors` and `_shared/rate-limiter`. No changes to any existing function.

### Files

Created:
- `src/pages/admin/AdminInstagramMarketing.tsx`
- `src/pages/admin/AdminMessengerMarketing.tsx`
- `src/pages/InstagramUnsubscribe.tsx`
- `src/pages/MessengerUnsubscribe.tsx`
- `supabase/functions/instagram-marketing-send/index.ts`
- `supabase/functions/messenger-marketing-send/index.ts`
- `src/content/docs/10-instagram-marketing.md`
- `src/content/docs/11-messenger-marketing.md`
- 1 SQL migration creating all 12 tables + GRANTs + RLS + seed templates

Modified (minimal):
- `src/App.tsx` — 4 new lazy routes
- `src/components/admin/AdminSidebar.tsx` — 2 nav entries under Marketing
- `src/lib/adminRoutePrefetch.ts` — 2 prefetch entries

## Explicitly deferred to v2

- Inbound webhook + 2-way DM (the existing Meta Conversations module already covers reading)
- Auto-firing on story replies / comments / cart events
- Subscriber sync from Meta Graph API
- A/B testing, catalog/product cards, ice-breakers, persistent menu
- Revenue attribution

## Risk

Storefront bundle untouched. All existing marketing channels untouched. New tables namespaced under `ig_*` / `msgr_*`. Failure isolated to each new tab.
