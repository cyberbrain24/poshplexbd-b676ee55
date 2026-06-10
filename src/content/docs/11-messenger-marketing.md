# Messenger Marketing

Superlight, isolated module mirroring the WhatsApp / Instagram Marketing pattern.

## What it does
- Bulk Messenger sends to saved subscribers (opted in) or a manual list of PSIDs.
- Fashion-commerce templates: new drop, flash sale, lookbook, back in stock, price drop, order shipped/delivered, review request, winback, birthday, membership welcome.
- Provider-agnostic HTTP config with messaging_type + tag fields for non-promotional one-time notifications.
- Suppression list + public opt-out page at `/messenger/unsubscribe?id=...`.
- Per-recipient logs and per-campaign stats.

## Meta policy reminder
Messenger only allows messages outside the 24-hour window through approved tags (POST_PURCHASE_UPDATE, ACCOUNT_UPDATE, CONFIRMED_EVENT_UPDATE) or HUMAN_AGENT. Pure promotional broadcasts must stay inside the 24-hour window.

## Tables (all `msgr_*`)
- `msgr_provider_settings`, `msgr_templates`, `msgr_subscribers`, `msgr_campaigns`, `msgr_messages`, `msgr_suppression`

## Edge function
- `messenger-marketing-send` — actions `bulk` | `single` | `test`. Substitutes `{to}`, `{body}`, `{media_url}`, `{access_token}`, `{page_id}`, `{messaging_type}`, `{message_tag}`.

## Isolation
No changes to storefront, checkout, customers, SMS, Email, WhatsApp, or existing Meta modules.
