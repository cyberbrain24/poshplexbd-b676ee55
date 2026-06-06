
-- 1) Remove public select on customers; expose only safe columns via a view
DROP POLICY IF EXISTS "Public can view public member profiles" ON public.customers;

CREATE OR REPLACE VIEW public.public_members
WITH (security_invoker = off) AS
SELECT
  c.id,
  c.name,
  c.profile_image_url,
  c.membership_assigned_at,
  c.customer_type_id
FROM public.customers c
WHERE c.public_profile_visible = true
  AND c.is_active = true
  AND c.customer_type_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.customer_types ct
    WHERE ct.id = c.customer_type_id
      AND ct.show_on_public_page = true
      AND ct.is_active = true
  );

GRANT SELECT ON public.public_members TO anon, authenticated;

-- 2) Restrict inventory_categories to admins only
DROP POLICY IF EXISTS "Public can view inventory_categories" ON public.inventory_categories;

-- 3) Add UPDATE policy for review images storage (scoped to own folder)
DROP POLICY IF EXISTS "Users can update own review images" ON storage.objects;
CREATE POLICY "Users can update own review images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'review-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
