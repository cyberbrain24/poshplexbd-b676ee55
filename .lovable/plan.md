## Email Marketing — Superlight Module

A minimal, fully isolated `/admin/email` module. Mirrors the SMS module's shape exactly so it integrates with zero behavior changes to existing code. All new tables, all new edge functions, **no edits to existing pages, contexts, hooks, or triggers**.

### Guiding rules (to stay out of the existing system's way)

- Only **additive** code. Zero edits to checkout, orders, cart, favorites, customer pages, or any existing edge function.
- All new tables prefixed `email_*`, RLS admin-only, GRANTs included.
- Lazy-loaded route — no impact on storefront bundle or initial admin load.
- No `pg_cron`, no background jobs, no webhooks, no tracking pixel infrastructure in v1. The complex automations (cart-abandonment timers, A/B winner picking, attribution) are **deferred** — they need cross-system hooks.
- One sidebar entry inside the existing Marketing group.
- No new npm dependencies.

### What ships in v1

**Sidebar:** add **Email Marketing** under Marketing group → `/admin/email`.

**Admin page** (`src/pages/admin/AdminEmail.tsx`) — same 5-tab shape as `AdminSMS.tsx`:

1. **Bulk Send** — subject, optional preheader, HTML body textarea + live `<iframe srcdoc>` preview, audience (All active customers / Membership / District / Manual list — identical to SMS), Send Now button. Calls `email-send` edge function.
2. **Auto Triggers** (templates only — admin-editable, **not auto-fired in v1**) — seeded rows for `order_placed`, `order_shipped`, `order_delivered`, `account_welcome`, `review_request`, `cart_abandoned`, `back_in_stock`, `winback`, `birthday`. Each has subject + HTML + enabled toggle. A clear note: "Trigger wiring is a future step — these templates are stored and ready."
3. **Provider Settings** — identical pattern to SMS: provider name, endpoint URL, HTTP method, headers JSON, request body template JSON with `{api_key} {from_email} {from_name} {to} {subject} {html}` placeholders, API key, From email, From name, Reply-To, success keyword, enabled. Works with SendGrid / Mailgun / Resend / Brevo / Postmark HTTP APIs.
4. **Campaigns** — list of bulk sends (name, recipients, sent, failed, status, when).
5. **History** — last 50 messages (to, subject, status, when).

**Compliance (lightweight):**
- Every bulk send auto-appends a plain-text footer line: `Unsubscribe: https://<site>/email/unsubscribe?e=<base64(email)>`
- Public storefront page `/email/unsubscribe` reads the param, inserts into `email_suppression`, shows a branded confirmation. No tokens, no edge function — direct insert via anon-allowed `INSERT` policy (no read).
- `email-send` filters recipients against `email_suppression` before sending.

### Database (one migration)

```text
email_provider_settings   single row seeded; provider config + from address + enabled
email_templates           event_key, name, subject, html, enabled, is_system, placeholders
email_campaigns           name, subject, recipient_count, sent_count, failed_count, status, created_at
email_messages            campaign_id, trigger_event, to_email, subject, status, error, created_at
email_suppression         email (unique), reason, created_at
```

All tables: `GRANT` to `authenticated` + `service_role`; RLS admin-only via `has_role(auth.uid(),'admin')`. `email_suppression` has one extra policy: anon can `INSERT` (so the public unsubscribe page works without auth) — no anon SELECT/UPDATE/DELETE.

### Edge function — exactly one new function

`supabase/functions/email-send/index.ts` — mirrors `sms-send` pattern:
- Action `bulk`: resolve audience from `audience_filter`, dedupe vs `email_suppression`, loop with small concurrency, fire HTTP using provider template, write `email_messages`, update `email_campaigns` counters.
- Action `single`: send one email (used by Auto-Trigger preview "Send test").
- Uses existing `_shared/rate-limiter` and `_shared/cors`.

### Files added (none modified beyond 3 wiring lines)

**New:**
- `src/pages/admin/AdminEmail.tsx`
- `src/pages/EmailUnsubscribe.tsx` (public, no auth)
- `supabase/functions/email-send/index.ts`
- `src/content/docs/08-email-marketing.md` (auto-picked up by Documentation module via `import.meta.glob`)

**Modified (tiny, additive only):**
- `src/App.tsx` — 2 lazy imports + 2 `<Route>` entries
- `src/lib/adminRoutePrefetch.ts` — 1 entry
- `src/components/admin/AdminSidebar.tsx` — 1 nav item inside existing Marketing group

That's it. No changes to checkout, orders, cart, favorites, customers, or any existing edge function.

### Explicitly deferred (v2)

To keep v1 truly lightweight and zero-risk:
- Cart-abandoned / back-in-stock / winback / birthday auto-firing (needs cron + cross-system hooks)
- Open/click tracking pixel + redirect
- A/B subject testing + scheduling
- Saved segment builder
- Revenue attribution (utm + 7-day join to orders)
- Visual block composer (product picker, coupon block)

When you're ready for any of these, they layer on without touching v1's contract.

### Risk summary

- Storefront bundle: no change (admin-only lazy chunk).
- Existing edge functions: no change.
- Existing tables: no change. New tables are isolated under `email_*`.
- Failure mode: if `email-send` or the provider fails, only the new tab shows the error — nothing else in the app is affected.
