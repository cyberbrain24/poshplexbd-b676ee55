
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;

DROP POLICY IF EXISTS "Can insert promo_code_usages for valid promos" ON public.promo_code_usages;
CREATE POLICY "Owners or guests can insert promo_code_usages for valid promos"
ON public.promo_code_usages
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.promo_codes pc
    WHERE pc.id = promo_code_usages.promo_code_id AND pc.is_active = true
  )
  AND (
    customer_id IS NULL
    OR customer_id = public.get_my_customer_id()
  )
);

DROP POLICY IF EXISTS "anyone can unsubscribe" ON public.email_suppression;

CREATE OR REPLACE FUNCTION public.public_unsubscribe_email(p_email text, p_reason text DEFAULT 'unsubscribe')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email IS NULL OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  INSERT INTO public.email_suppression (email, reason)
  VALUES (v_email, COALESCE(NULLIF(p_reason, ''), 'unsubscribe'))
  ON CONFLICT DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.public_unsubscribe_email(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_unsubscribe_email(text, text) TO anon, authenticated;

DROP POLICY IF EXISTS "Owners and admins can insert order_items" ON public.order_items;
CREATE POLICY "Owners and admins can insert order_items"
ON public.order_items
FOR INSERT
TO public
WITH CHECK (
  is_admin() OR EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND o.customer_id IS NOT NULL
      AND o.customer_id = public.get_my_customer_id()
  )
);

REVOKE SELECT (api_key, endpoint_url, headers, request_template) ON public.email_provider_settings FROM anon;
REVOKE SELECT (api_key, endpoint_url, headers, request_template) ON public.sms_provider_settings FROM anon;
REVOKE SELECT (access_token, app_secret, app_id, verify_token) ON public.meta_channels FROM anon;
REVOKE SELECT (openai_api_key, anthropic_api_key, gemini_api_key, openrouter_api_key, meta_capi_access_token) ON public.site_settings FROM anon;
