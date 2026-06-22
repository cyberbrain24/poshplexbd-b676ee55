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

const { data, error } = await supabase.functions.invoke("create-customer-account", {
  body: { name: "Jane", phone: "01700000000", password: "secret" },
});
```

## Catalogue

| Function | Purpose | Auth |
|---|---|---|
| `convert-storage-to-webp` | Background image migration to WebP. | Service role |
| `create-customer-account` | Server-side customer signup with hashed password. | Public, rate-limited |
| `delete-auth-users` | Removes orphaned auth users. | Service role |
| `email-send` | Sends transactional email via configured provider. | Internal |
| `impersonate-customer` | "Login as Customer" for admin support. | Admin only |
| `meta-capi` | Server-side Meta CAPI mirror. | Internal |
| `regenerate-image-thumbnails` | Rebuilds thumbnail variants for media. | Admin only |
| `sms-send` | Sends an SMS via configured provider. | Internal |
| `sms-order-placed` | Order-placed SMS notification. | Internal |
| `steadfast-courier` | Creates consignments on Steadfast. | Admin only |

## Rate limiting

Use `_shared/rate-limiter.ts`. Public endpoints must rate-limit per IP. Admin endpoints must validate the caller via `has_role` before doing any work.
