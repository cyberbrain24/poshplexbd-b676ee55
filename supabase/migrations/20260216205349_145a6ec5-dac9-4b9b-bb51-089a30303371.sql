
-- 1. Drop redundant promo_usages table (promo_code_usages is the canonical table)
DROP TABLE IF EXISTS public.promo_usages CASCADE;

-- 2. Drop dev-only seed_jobs table
DROP TABLE IF EXISTS public.seed_jobs CASCADE;

-- 3. Drop unused tracking_events table (also fixes permissive RLS warning)
DROP TRIGGER IF EXISTS cleanup_tracking_events_trigger ON public.tracking_events;
DROP FUNCTION IF EXISTS public.cleanup_tracking_events() CASCADE;
DROP TABLE IF EXISTS public.tracking_events CASCADE;
