# Instagram DM Marketing

Superlight, isolated module mirroring the WhatsApp Marketing pattern.

## What it does
- Bulk DM sends to your saved IG subscribers (opted in) or a manual list of IG-scoped recipient IDs.
- Fashion-commerce templates: new drop, flash sale, lookbook, back in stock, price drop, order shipped/delivered, review request, winback, birthday, membership welcome, story reply follow-up, comment reply.
- Provider-agnostic HTTP config — works with Meta Graph API, ManyChat, Chatfox, etc.
- Suppression list + public opt-out page at `/instagram/unsubscribe?id=...`.
- Per-recipient logs and per-campaign stats.

## Meta policy reminder
Instagram only allows marketing messages inside the 24-hour user-initiated window, or via approved Recurring Notifications / Human Agent tags. Always confirm recipients have a recent active thread or opted-in subscription before bulk sending.

## Tables (all `ig_*`)
- `ig_provider_settings`, `ig_templates`, `ig_subscribers`, `ig_campaigns`, `ig_messages`, `ig_suppression`

## Edge function
- `instagram-marketing-send` — actions `bulk` | `single` | `test`. Substitutes `{to}`, `{body}`, `{media_url}`, `{access_token}`, `{ig_user_id}` into provider JSON.

## Isolation
No changes to storefront, checkout, customers, SMS, Email, WhatsApp, or existing Meta modules.
