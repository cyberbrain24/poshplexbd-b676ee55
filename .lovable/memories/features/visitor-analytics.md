---
name: Visitor Analytics
description: Storefront-only page view tracker with IP geo, live count, graphs, and recent visits in admin marketing module.
type: feature
---
- Tables: `page_views` (30-day retention) + `ip_geo_cache` (90-day). Both admin-read-only via RLS.
- Tracking: `useVisitorTracking` hook fires per route change (debounced 600ms), skips `/admin/*` and bots. Inserts via `track-visit` edge function (verify_jwt=false, service_role write).
- Geo: `ip-api.com` free tier, cached per IP in `ip_geo_cache` to minimize calls.
- Daily `pg_cron` job `cleanup-visitor-analytics-daily` purges old rows.
- Live count: `get_active_visitors_count()` RPC (5-min active window). Admin page polls every 15s.
- Admin route: `/admin/marketing/visitors`. Tab added to MarketingLayout.
- Session ID stored in sessionStorage (`pp_session_id`).
