
CREATE OR REPLACE FUNCTION public.find_product_by_short_id(short_id text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.products WHERE id::text LIKE short_id || '%' LIMIT 1;
$$;
