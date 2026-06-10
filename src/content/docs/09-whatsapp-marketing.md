# WhatsApp Marketing

Lightweight, isolated module for sending WhatsApp marketing and transactional messages.

## Location
`/admin/whatsapp-marketing` (Marketing sidebar group).

## Tabs
- **Bulk Send** — text + optional media (image/video/document), audience targeting, WhatsApp-style preview.
- **Auto Triggers** — 14 fashion-commerce templates (order lifecycle, cart, drop, lookbook, review, winback, birthday, membership). Editable; auto-firing is v2.
- **Provider Settings** — Provider-agnostic HTTP config. Works with Meta Cloud API, 360dialog, Gupshup, Twilio, Interakt, WATI. Placeholders: `{api_key}`, `{business_phone_id}`, `{to}`, `{body}`, `{media_url}`.
- **Campaigns** — bulk send history with counts.
- **History** — per-recipient logs.
- **Opt-outs** — manual & public via `/whatsapp/unsubscribe?phone=...`.

## Compliance
Suppression list filtered before every send. Public opt-out page allows recipients to remove themselves.

## Default provider seed
Meta Cloud API endpoint: `https://graph.facebook.com/v20.0/{business_phone_id}/messages`
Headers: `Authorization: Bearer {api_key}`
Body: `{"messaging_product":"whatsapp","to":"{to}","type":"text","text":{"body":"{body}"}}`

## Isolation
- Tables prefixed `wa_*`, admin-only RLS, GRANTs included.
- New edge function `whatsapp-marketing-send` is independent of the existing `whatsapp-send` (transactional) function.
- No changes to storefront, orders, checkout, or other marketing modules.
