
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============ page_views ============
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  referrer text,
  user_agent text,
  device_type text,
  ip_address text,
  country text,
  country_code text,
  region text,
  city text,
  session_id text,
  customer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page_views"
  ON public.page_views FOR SELECT
  USING (public.is_admin());

CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_country ON public.page_views (country);
CREATE INDEX idx_page_views_path ON public.page_views (path);
CREATE INDEX idx_page_views_session_id ON public.page_views (session_id);

-- ============ ip_geo_cache ============
CREATE TABLE public.ip_geo_cache (
  ip_address text NOT NULL PRIMARY KEY,
  country text,
  country_code text,
  region text,
  city text,
  lat double precision,
  lon double precision,
  isp text,
  cached_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ip_geo_cache TO authenticated;
GRANT ALL ON public.ip_geo_cache TO service_role;

ALTER TABLE public.ip_geo_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ip_geo_cache"
  ON public.ip_geo_cache FOR SELECT
  USING (public.is_admin());

-- ============ Live visitor count helper ============
CREATE OR REPLACE FUNCTION public.get_active_visitors_count()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active', COUNT(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '2 minutes'),
    'last_5m', COUNT(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '5 minutes'),
    'last_30m', COUNT(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '30 minutes')
  )
  FROM public.page_views
  WHERE created_at > now() - interval '30 minutes'
    AND public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.get_active_visitors_count() TO authenticated;

-- ============ Daily cleanup job ============
CREATE OR REPLACE FUNCTION public.cleanup_visitor_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.page_views WHERE created_at < now() - interval '30 days';
  DELETE FROM public.ip_geo_cache WHERE cached_at < now() - interval '90 days';
END;
$$;

SELECT cron.schedule(
  'cleanup-visitor-analytics-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_visitor_analytics(); $$
);
