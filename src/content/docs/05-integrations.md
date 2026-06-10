---
title: Integrations (Steadfast, Meta, GA4, SMS)
category: Integrations
order: 20
updated: 2026-06-10
---

# Third-Party Integrations

## Steadfast Courier

Edge function: `supabase/functions/steadfast-courier/index.ts`. Push-based integration with Steadfast Courier Ltd. Admin clicks "Sync Steadfast" on the orders page; the function creates consignments and stores tracking metadata on the order.

## Meta Pixel + CAPI

- **Pixel:** client-side script lazy-loaded by `FacebookPixelTracker`. Settings stored on `site_settings`.
- **CAPI:** server-side event mirror via `supabase/functions/meta-capi/index.ts`. Hashes PII before sending.
- Configured at `/admin/marketing/meta-pixel` and `/admin/marketing/meta-capi`.

## Google Analytics 4

GA4 measurement ID is stored on the single `site_settings` row. Injected into `<head>` only when enabled. Managed at `/admin/marketing/ga4`.

## SMS Marketing

Edge function: `supabase/functions/sms-send/index.ts`. Templates and campaigns in `sms_templates` / `sms_campaigns` tables. Order-placed notifications via `sms-order-placed`.

## AI

Lovable AI Gateway is the default provider. Edge functions:

- `admin-product-ai` — Gemini chat that can create/update products with a write-confirmation flow.
- `ai-seo-generate` — product descriptions and meta tags.
- `ai-search-suggest` — instant search suggestions for the storefront.
