---
title: Edge Functions Reference
category: API
order: 30
updated: 2026-06-10
---

# Edge Functions

All functions live under `supabase/functions/<name>/index.ts`. Shared utilities (CORS, rate limiter, AI client, SMS client) are in `supabase/functions/_shared/`.

## Invocation pattern

From the frontend:

```ts
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("admin-product-ai", {
  body: { message: "Create a black tee at 1200 BDT" },
});
```

## Catalogue

| Function | Purpose | Auth |
|---|---|---|
| `admin-product-ai` | Conversational product CRUD (Gemini). Writes require a confirm step. | Admin only |
| `admin-reset-password` | Securely reset the primary admin password. | Service role |
| `ai-search-suggest` | Storefront search autocomplete. | Public, rate-limited |
| `ai-seo-generate` | Generates product descriptions and meta tags. | Admin only |
| `create-customer-account` | Server-side customer signup with hashed password. | Public, rate-limited |
| `delete-auth-users` | Removes orphaned auth users. | Service role |
| `gemini-credentials-status` | Health check for AI credentials. | Admin only |
| `impersonate-customer` | "Login as Customer" for admin support. | Admin only |
| `meta-capi` | Server-side Meta CAPI mirror. | Internal |
| `sms-send` | Sends an SMS via configured provider. | Internal |
| `sms-order-placed` | Order-placed SMS notification. | Internal |
| `sitemap` | Generates `sitemap.xml` for SEO. | Public |
| `steadfast-courier` | Creates consignments on Steadfast. | Admin only |
| `track-visit` | Anonymous visitor analytics ping. | Public |

## Rate limiting

Use `_shared/rate-limiter.ts`. Public endpoints must rate-limit per IP. Admin endpoints must validate the caller via `has_role` before doing any work.
