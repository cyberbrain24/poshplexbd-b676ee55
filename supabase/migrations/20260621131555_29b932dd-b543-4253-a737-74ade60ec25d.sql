
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-visitor-analytics-daily';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_visitor_analytics(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_visits(integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_active_visitors_count() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_visitor_analytics() CASCADE;
DROP TABLE IF EXISTS public.page_views CASCADE;
DROP TABLE IF EXISTS public.ip_geo_cache CASCADE;
