---
title: Email Marketing Module
category: Marketing
order: 8
updated: 2026-06-10
---

# Email Marketing Module

Lightweight, fully isolated email marketing module at `/admin/email`. Built to mirror the SMS module so it integrates with zero impact on the rest of the app.

## Scope (v1)

- Bulk campaigns (subject + HTML body + audience filters + live preview)
- Editable transactional templates (stored, not auto-fired in v1)
- Configurable HTTP provider (Resend / Mailgun / SendGrid / Brevo / Postmark)
- Campaign list, message history, suppression list
- Public one-click unsubscribe at `/email/unsubscribe`

## Tables

- `email_provider_settings` — single row, provider HTTP config
- `email_templates` — 9 seeded ecommerce events
- `email_campaigns` — bulk send history
- `email_messages` — per-message log
- `email_suppression` — unsubscribed/bounced addresses (admin-managed + public insert via unsubscribe page)

All tables are admin-only via `has_role(auth.uid(),'admin')`. `email_suppression` allows `INSERT` from anon for the unsubscribe page only.

## Edge function

`email-send` — single action (`bulk` or `single`). Validates admin, loads provider settings, resolves audience from `customers`, dedupes against `email_suppression`, fires HTTP per recipient, writes `email_messages`, updates `email_campaigns` counters. Auto-appends an unsubscribe footer to every email.

## Audience filters

- `all` — all active customers with an email
- `membership` — by `customer_type_id`
- `division` — by district
- `manual` — pasted email list

## Placeholders

In endpoint URL, headers, and request body template: `{api_key} {from_email} {from_name} {reply_to} {to} {name} {subject} {html} {text}`.

In bulk HTML body: `{name}` is replaced per recipient.

## Compliance

Every send appends `Unsubscribe: /email/unsubscribe?e=<base64(email)>`. The public page inserts the address into `email_suppression`, which all subsequent sends honour.

## Deferred to v2

Auto-firing on app events (order placed, cart abandoned, back-in-stock, win-back, birthday), open/click tracking, A/B subject testing, scheduling, saved segment builder, revenue attribution, visual block composer.
