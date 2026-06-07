
CREATE OR REPLACE FUNCTION public.get_active_visitors_count()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active', COUNT(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '5 minutes'),
    'last_30m', COUNT(DISTINCT session_id) FILTER (WHERE created_at > now() - interval '30 minutes'),
    'today', COUNT(DISTINCT session_id) FILTER (WHERE created_at::date = CURRENT_DATE)
  )
  FROM public.page_views
  WHERE created_at > CURRENT_DATE
    AND public.is_admin();
$$;
