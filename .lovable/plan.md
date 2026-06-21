## Goal
Completely remove the in-house Visitor Analytics module since GA4 now covers visitor tracking.

## Frontend removals
- **`src/App.tsx`** — remove `VisitorTracker` import + `<VisitorTracker />` render, and the lazy `VisitorAnalytics` import + `<Route path="visitors">` inside the marketing routes.
- Delete files:
  - `src/components/tracking/VisitorTracker.tsx`
  - `src/hooks/useVisitorTracking.ts`
  - `src/pages/admin/marketing/VisitorAnalytics.tsx`
- **`src/pages/admin/marketing/MarketingLayout.tsx`** — remove the "Visitors" tab/link.
- **`src/pages/admin/marketing/MarketingOverview.tsx`** — remove any visitor stats/cards/links.
- Search for any other references to `VisitorTracker`, `useVisitorTracking`, `/admin/marketing/visitors`, `page_views`, `track-visit`, `get_active_visitors_count`, `ip_geo_cache` and clean up.

## Backend removals
- Delete edge function: `supabase/functions/track-visit/` (folder + config entry in `supabase/config.toml` if present).
- Migration to:
  - `DROP FUNCTION IF EXISTS public.get_active_visitors_count() CASCADE;`
  - `DROP TABLE IF EXISTS public.page_views CASCADE;`
  - `DROP TABLE IF EXISTS public.ip_geo_cache CASCADE;`
  - Unschedule the `cleanup-visitor-analytics-daily` pg_cron job if it exists.

## Memory cleanup
- Delete `mem://features/visitor-analytics` and remove its line from `mem://index.md`.

## Verification
- Build passes; `/admin/marketing` no longer shows Visitors tab; no requests to `track-visit` from storefront. GA4 tracker remains untouched.
