CREATE OR REPLACE FUNCTION public.admin_list_schema()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT jsonb_agg(t ORDER BY t->>'table_name')
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'table_name', c.table_name,
      'columns', (
        SELECT jsonb_agg(jsonb_build_object(
          'name', col.column_name,
          'type', col.data_type,
          'nullable', col.is_nullable = 'YES',
          'default', col.column_default
        ) ORDER BY col.ordinal_position)
        FROM information_schema.columns col
        WHERE col.table_schema = 'public' AND col.table_name = c.table_name
      )
    ) AS t
    FROM information_schema.tables c
    WHERE c.table_schema = 'public' AND c.table_type = 'BASE TABLE'
  ) sub;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_schema() TO authenticated, service_role;