CREATE OR REPLACE FUNCTION public.get_daily_visits(p_days int DEFAULT 30)
RETURNS TABLE(date date, visits bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  RETURN QUERY
  WITH series AS (
    SELECT generate_series(
      (CURRENT_DATE - (p_days - 1))::date,
      CURRENT_DATE,
      interval '1 day'
    )::date AS d
  ),
  agg AS (
    SELECT created_at::date AS d, count(*) AS c
    FROM public.page_views
    WHERE created_at >= (CURRENT_DATE - (p_days - 1))
    GROUP BY 1
  )
  SELECT s.d, COALESCE(a.c, 0)::bigint
  FROM series s
  LEFT JOIN agg a ON a.d = s.d
  ORDER BY s.d;
END;
$$;