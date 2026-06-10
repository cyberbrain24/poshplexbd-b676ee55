# WhatsApp Marketing Module (Superlight)

Mirrors the Email Marketing module shape, fully isolated from existing code. Zero edits to checkout, orders, cart, customers, or existing edge functions. All new tables prefixed `wa_*`. Lazy-loaded route. No pg_cron, no inbound webhooks in v1.

## Guiding rules

- Isolated: no changes to storefront, checkout, orders, SMS, or Email modules.
- Admin-only, RLS via `has_role(auth.uid(),'admin')` + explicit GRANTs.
- Provider-agnostic HTTP config (works with Meta Cloud API, 360dialog, Gupshup, Twilio, Interakt, WATI, etc.).
- v1 = templates + bulk send + logs + opt-out. Auto-firing is template-only; runtime hooks deferred to v2.

## What ships in v1

### Sidebar
Add "WhatsApp Marketing" under Marketing group → `/admin/whatsapp-marketing` (icon: `MessageCircle`). Existing `WhatsApp API` settings page stays untouched.

### Admin page `AdminWhatsAppMarketing.tsx` (mirrors AdminEmail)
Tabs:
1. **Bulk Send**
   - Audience: All customers / Membership type / District / Manual phone list
   - Message type: Text (session) OR Approved Template (with variable inputs)
   - Optional media URL (image/video/document) — fashion brand use cases: new drop, lookbook, size chart, order-status nudge
   - Live preview bubble (WhatsApp-style chat UI)
   - Schedule (stored only; sender runs on click in v1)
2. **Auto Triggers (templates)** — manageable templates for fashion-commerce events:
   - `order_placed`, `order_shipped`, `order_delivered`, `cod_confirmation`
   - `cart_abandoned`, `back_in_stock`, `price_drop`
   - `new_drop_announcement`, `flash_sale`, `lookbook_share`
   - `review_request`, `winback_30d`, `birthday_offer`, `membership_welcome`
   - Edit name, language, body, variables, header media. v1 stores only — runtime auto-firing deferred to v2.
3. **Campaigns** — history of bulk sends with stats (sent/failed/opted-out).
4. **Provider Settings** — single row:
   - Provider name, API base URL, auth header, business phone number ID
   - JSON body template with `{to}`, `{template_name}`, `{language}`, `{variables}`, `{media_url}`
   - Default sender display name
5. **Opt-outs** — list of `wa_suppression` numbers + manual add/remove.

### Compliance
- Every bulk send filters against `wa_suppression` before dispatch.
- Footer line auto-appended to free-form text messages: "Reply STOP to opt out."
- Public route `/whatsapp/unsubscribe?phone=...` inserts into `wa_suppression`.
- No marketing sends to numbers without prior consent flag on customer (uses existing `customers.phone`; admin must confirm audience).

### Database (new tables, all `wa_*`)
- `wa_provider_settings` — single-row provider config
- `wa_templates` — name, language, category, header_type, body, variables[], media_url
- `wa_campaigns` — audience filter, template_id, status, counters, scheduled_at
- `wa_messages` — per-recipient log: phone, template/text, status, provider_message_id, error
- `wa_suppression` — phone (unique), reason, source

All tables: GRANT to `authenticated` + `service_role`, RLS admin-only. `wa_suppression` gets anon `INSERT` only for the public unsubscribe page.

### Edge function `whatsapp-marketing-send`
Mirrors `email-send` pattern:
- Actions: `bulk` | `single` | `test`
- Resolves audience from `customers` (by membership/district/manual)
- Filters suppression list
- Substitutes variables in provider JSON body template
- Posts to configured provider URL, logs each result to `wa_messages`
- Uses existing `_shared/cors` and `_shared/rate-limiter`
- No changes to existing `whatsapp-send` function (kept for transactional/API testing)

### Files

Created:
- `src/pages/admin/AdminWhatsAppMarketing.tsx`
- `src/pages/WhatsAppUnsubscribe.tsx`
- `supabase/functions/whatsapp-marketing-send/index.ts`
- `src/content/docs/09-whatsapp-marketing.md`

Modified (minimal):
- `src/App.tsx` — 2 new lazy routes
- `src/components/admin/AdminSidebar.tsx` — 1 nav entry under Marketing
- `src/lib/adminRoutePrefetch.ts` — 1 prefetch entry

## Explicitly deferred to v2

- Inbound webhook + 2-way chat (Meta WhatsApp Conversations already exists separately)
- Auto-firing on cart/order events (templates ship; wiring later)
- Click/read receipts ingestion
- A/B template testing
- Catalog/product message blocks
- Saved segment builder, revenue attribution

## Risk

Storefront bundle untouched. Existing WhatsApp API page, SMS, and Email modules untouched. Failure isolated to the new tab. New tables namespaced under `wa_*`.
