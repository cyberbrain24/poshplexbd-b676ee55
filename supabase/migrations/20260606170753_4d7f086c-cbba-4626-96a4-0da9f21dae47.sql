
DROP VIEW IF EXISTS public.public_members;

CREATE OR REPLACE FUNCTION public.get_public_members(p_customer_type_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  profile_image_url text,
  membership_assigned_at timestamptz,
  customer_type_id uuid,
  customer_type_name text,
  show_member_since boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    c.profile_image_url,
    c.membership_assigned_at,
    c.customer_type_id,
    ct.name AS customer_type_name,
    ct.show_member_since
  FROM public.customers c
  JOIN public.customer_types ct ON ct.id = c.customer_type_id
  WHERE c.public_profile_visible = true
    AND c.is_active = true
    AND ct.show_on_public_page = true
    AND ct.is_active = true
    AND (p_customer_type_id IS NULL OR c.customer_type_id = p_customer_type_id)
  ORDER BY c.name;
$$;

REVOKE ALL ON FUNCTION public.get_public_members(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_members(uuid) TO anon, authenticated;
