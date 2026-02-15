
-- Create a SECURITY DEFINER function for guest checkout customer upsert
CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT 'other',
  p_address TEXT DEFAULT NULL,
  p_division_id UUID DEFAULT NULL,
  p_thana_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Validate phone is provided
  IF p_phone IS NULL OR p_phone = '' THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;

  -- Check if customer exists
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = p_phone
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    -- Update existing customer with latest details
    UPDATE public.customers SET
      name = COALESCE(NULLIF(p_name, ''), name),
      email = COALESCE(NULLIF(p_email, ''), email),
      address = COALESCE(NULLIF(p_address, ''), address),
      division_id = COALESCE(p_division_id, division_id),
      thana_id = COALESCE(p_thana_id, thana_id),
      updated_at = NOW()
    WHERE id = v_customer_id;
  ELSE
    -- Create new customer
    INSERT INTO public.customers (name, phone, email, gender, address, division_id, thana_id, is_active)
    VALUES (p_name, p_phone, p_email, COALESCE(p_gender, 'other'), p_address, p_division_id, p_thana_id, true)
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$$;

-- Now tighten the UPDATE policy - remove the guest bypass since we use SECURITY DEFINER
DROP POLICY IF EXISTS "Linked users or admin can update customers" ON public.customers;

CREATE POLICY "Linked users or admin can update customers"
ON public.customers
FOR UPDATE
USING (
  is_admin()
  OR
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca
    WHERE ca.customer_id = customers.id
    AND ca.auth_user_id = auth.uid()
  )
);

-- Tighten INSERT policy too - authenticated users only, guests use the RPC
DROP POLICY IF EXISTS "Authenticated or checkout can insert customers" ON public.customers;

CREATE POLICY "Authenticated users can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
