
CREATE OR REPLACE FUNCTION public.get_visitor_analytics(p_range text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_bucket interval;
  v_result jsonb;
  v_admin boolean;
BEGIN
  -- Restrict to admins
  SELECT public.has_role(auth.uid(), 'admin') INTO v_admin;
  IF NOT COALESCE(v_admin, false) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_range = '7d' THEN
    v_start := now() - interval '7 days';
    v_bucket := interval '1 day';
  ELSIF p_range = '30d' THEN
    v_start := now() - interval '30 days';
    v_bucket := interval '1 day';
  ELSE
    v_start := now() - interval '24 hours';
    v_bucket := interval '1 hour';
  END IF;

  WITH base AS (
    SELECT * FROM public.page_views WHERE created_at >= v_start
  ),
  series AS (
    SELECT generate_series(
      date_trunc(CASE WHEN v_bucket = interval '1 day' THEN 'day' ELSE 'hour' END, v_start),
      date_trunc(CASE WHEN v_bucket = interval '1 day' THEN 'day' ELSE 'hour' END, now()),
      v_bucket
    ) AS bucket
  ),
  bucketed AS (
    SELECT date_trunc(CASE WHEN v_bucket = interval '1 day' THEN 'day' ELSE 'hour' END, created_at) AS bucket,
           count(*) AS visits,
           count(DISTINCT session_id) AS unique_sessions
    FROM base
    GROUP BY 1
  ),
  timeseries AS (
    SELECT s.bucket,
           COALESCE(b.visits, 0) AS visits,
           COALESCE(b.unique_sessions, 0) AS unique_sessions
    FROM series s
    LEFT JOIN bucketed b ON b.bucket = s.bucket
    ORDER BY s.bucket
  ),
  totals AS (
    SELECT count(*) AS total_views,
           count(DISTINCT session_id) AS unique_visitors
    FROM base
  ),
  top_pages AS (
    SELECT path, count(*) AS cnt
    FROM base
    GROUP BY path ORDER BY cnt DESC LIMIT 10
  ),
  top_countries AS (
    SELECT COALESCE(country, 'Unknown') AS country,
           COALESCE(MAX(country_code), '') AS country_code,
           count(*) AS cnt
    FROM base
    GROUP BY 1 ORDER BY cnt DESC LIMIT 10
  ),
  devices AS (
    SELECT COALESCE(device_type, 'unknown') AS device, count(*) AS cnt
    FROM base GROUP BY 1 ORDER BY cnt DESC
  )
  SELECT jsonb_build_object(
    'total_views', (SELECT total_views FROM totals),
    'unique_visitors', (SELECT unique_visitors FROM totals),
    'timeseries', (SELECT COALESCE(jsonb_agg(jsonb_build_object('bucket', bucket, 'visits', visits, 'unique', unique_sessions)), '[]'::jsonb) FROM timeseries),
    'top_pages', (SELECT COALESCE(jsonb_agg(jsonb_build_object('path', path, 'count', cnt)), '[]'::jsonb) FROM top_pages),
    'top_countries', (SELECT COALESCE(jsonb_agg(jsonb_build_object('country', country, 'country_code', country_code, 'count', cnt)), '[]'::jsonb) FROM top_countries),
    'devices', (SELECT COALESCE(jsonb_agg(jsonb_build_object('device', device, 'count', cnt)), '[]'::jsonb) FROM devices)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_visitor_analytics(text) TO authenticated;
