
-- ============================================================
-- 1. CUSTOMERS: remove blanket public read
-- ============================================================
DROP POLICY IF EXISTS "Public can find customers by phone" ON public.customers;

-- SECURITY DEFINER lookup returning only the id, used by signup/promo/etc.
CREATE OR REPLACE FUNCTION public.find_customer_id_by_phone(p_phone text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE phone = p_phone LIMIT 1;
$$;

-- Returns multiple customer ids that share a phone (used by promo per-customer check)
CREATE OR REPLACE FUNCTION public.find_customer_ids_by_phone(p_phone text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE phone = p_phone;
$$;

-- ============================================================
-- 2. ORDERS: remove blanket guest branch from SELECT
-- ============================================================
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (
  is_admin()
  OR (customer_id IS NOT NULL AND customer_id = get_my_customer_id())
);

-- Public/guest order tracking via SECURITY DEFINER RPC (safe column subset)
CREATE OR REPLACE FUNCTION public.track_orders_lookup(
  p_order_number text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF COALESCE(NULLIF(trim(p_order_number), ''), NULLIF(trim(p_phone), ''), NULLIF(trim(p_email), '')) IS NULL THEN
    RAISE EXCEPTION 'At least one search field is required';
  END IF;

  SELECT COALESCE(jsonb_agg(o ORDER BY (o->>'created_at') DESC), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'order_status', o.order_status,
      'payment_status', o.payment_status,
      'currency', o.currency,
      'subtotal', o.subtotal,
      'discount_amount', o.discount_amount,
      'shipping_cost', o.shipping_cost,
      'tax_amount', o.tax_amount,
      'total_amount', o.total_amount,
      'paid_amount', o.paid_amount,
      'created_at', o.created_at,
      'shipped_at', o.shipped_at,
      'delivered_at', o.delivered_at,
      'tracking_number', o.tracking_number,
      'courier_name', o.courier_name,
      'shipping_name', o.shipping_name,
      'shipping_phone', o.shipping_phone,
      'shipping_address', o.shipping_address,
      'shipping_city', o.shipping_city,
      'items', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', i.id,
          'product_name', i.product_name,
          'variant_sku', i.variant_sku,
          'variant_details', i.variant_details,
          'unit_price', i.unit_price,
          'quantity', i.quantity,
          'line_total', i.line_total,
          'fulfillment_status', i.fulfillment_status
        ))
        FROM public.order_items i WHERE i.order_id = o.id
      ), '[]'::jsonb),
      'status_history', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', h.id,
          'new_status', h.new_status,
          'previous_status', h.previous_status,
          'status_type', h.status_type,
          'notes', h.notes,
          'created_at', h.created_at
        ) ORDER BY h.created_at DESC)
        FROM public.order_status_history h WHERE h.order_id = o.id
      ), '[]'::jsonb),
      'payment_method', COALESCE((
        SELECT jsonb_build_object('id', pm.id, 'name', pm.name, 'type', pm.type)
        FROM public.payment_methods pm WHERE pm.id = o.payment_method_id
      ), NULL)
    ) AS o
    FROM public.orders o
    WHERE
      (p_order_number IS NOT NULL AND trim(p_order_number) <> '' AND o.order_number = trim(p_order_number))
      OR (p_phone IS NOT NULL AND trim(p_phone) <> '' AND (o.shipping_phone = trim(p_phone) OR o.guest_phone = trim(p_phone)))
      OR (p_email IS NOT NULL AND trim(p_email) <> '' AND (o.shipping_email = trim(p_email) OR o.guest_email = trim(p_email)))
    LIMIT 50
  ) sub;

  RETURN v_result;
END;
$$;

-- ============================================================
-- 3. SITE_SETTINGS: hide sensitive token; expose safe view
-- ============================================================
DROP POLICY IF EXISTS "Public can read site_settings" ON public.site_settings;

-- Safe public view (excludes meta_capi_access_token)
CREATE OR REPLACE VIEW public.public_site_settings
WITH (security_invoker = true) AS
SELECT
  id,
  ga4_enabled,
  ga4_measurement_id,
  meta_pixel_enabled,
  meta_pixel_id,
  meta_test_mode,
  meta_advanced_matching,
  meta_ecommerce_events_enabled,
  meta_capi_enabled,
  created_at,
  updated_at
FROM public.site_settings;

-- A permissive SELECT policy on the underlying table is required for the view
-- (security_invoker). We still gate the sensitive token by removing public
-- column access through the view. Add admin-only column-level: easier path is
-- to keep table SELECT for admins only and grant SELECT on the view to anon.
CREATE POLICY "Admins can read site_settings"
ON public.site_settings
FOR SELECT
USING (is_admin());

-- The view bypasses RLS via security_invoker=true only when caller can read
-- underlying rows. So we need a row-readable path for anon limited to safe
-- columns. Approach: keep a SELECT policy that allows public reads, but block
-- direct column access using a SECURITY DEFINER function instead. Simpler:
-- redefine the view as security_definer-style via a function.
DROP VIEW IF EXISTS public.public_site_settings;

CREATE OR REPLACE FUNCTION public.get_public_site_settings()
RETURNS TABLE (
  id uuid,
  ga4_enabled boolean,
  ga4_measurement_id text,
  meta_pixel_enabled boolean,
  meta_pixel_id text,
  meta_test_mode boolean,
  meta_advanced_matching boolean,
  meta_ecommerce_events_enabled boolean,
  meta_capi_enabled boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, ga4_enabled, ga4_measurement_id, meta_pixel_enabled, meta_pixel_id,
         meta_test_mode, meta_advanced_matching, meta_ecommerce_events_enabled,
         meta_capi_enabled
  FROM public.site_settings
  LIMIT 1;
$$;

-- ============================================================
-- 4. ORDER_ITEMS: restrict SELECT to admins/owners; tighten INSERT
-- ============================================================
DROP POLICY IF EXISTS "Public can view order_items" ON public.order_items;
CREATE POLICY "Owners and admins can view order_items"
ON public.order_items
FOR SELECT
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id IS NOT NULL
      AND o.customer_id = get_my_customer_id()
  )
);

DROP POLICY IF EXISTS "Can create order_items for existing orders" ON public.order_items;
CREATE POLICY "Owners and admins can insert order_items"
ON public.order_items
FOR INSERT
WITH CHECK (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id IS NOT NULL
      AND o.customer_id = get_my_customer_id()
  )
);

-- ============================================================
-- 5. RETURN_REQUESTS: restrict SELECT and INSERT
-- ============================================================
DROP POLICY IF EXISTS "Public can view return_requests" ON public.return_requests;
CREATE POLICY "Owners and admins can view return_requests"
ON public.return_requests
FOR SELECT
USING (
  is_admin()
  OR (customer_id IS NOT NULL AND customer_id = get_my_customer_id())
);

DROP POLICY IF EXISTS "Can create return_requests for own orders" ON public.return_requests;
CREATE POLICY "Owners and admins can insert return_requests"
ON public.return_requests
FOR INSERT
WITH CHECK (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = return_requests.order_id
      AND o.customer_id IS NOT NULL
      AND o.customer_id = get_my_customer_id()
  )
);

-- ============================================================
-- 6. PROMO_CODE_USAGES: restrict SELECT
-- ============================================================
DROP POLICY IF EXISTS "Public can view own promo_code_usages" ON public.promo_code_usages;
CREATE POLICY "Owners and admins can view promo_code_usages"
ON public.promo_code_usages
FOR SELECT
USING (
  is_admin()
  OR (customer_id IS NOT NULL AND customer_id = get_my_customer_id())
);

-- ============================================================
-- 7. ORDER_STATUS_HISTORY: restrict SELECT
-- ============================================================
DROP POLICY IF EXISTS "Public can view order_status_history" ON public.order_status_history;
CREATE POLICY "Owners and admins can view order_status_history"
ON public.order_status_history
FOR SELECT
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_status_history.order_id
      AND o.customer_id IS NOT NULL
      AND o.customer_id = get_my_customer_id()
  )
);

-- ============================================================
-- 8. STORAGE: tighten profile-images & review-images policies
-- ============================================================
DROP POLICY IF EXISTS "Users can update profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload profile images" ON storage.objects;

CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can upload review images" ON storage.objects;
CREATE POLICY "Users can upload own review images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'review-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
