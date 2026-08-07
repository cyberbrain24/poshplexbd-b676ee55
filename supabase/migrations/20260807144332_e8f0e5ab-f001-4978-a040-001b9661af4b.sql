CREATE OR REPLACE FUNCTION public.ensure_my_customer_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_customer_id uuid;
  v_email text;
  v_phone text;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT ca.customer_id INTO v_customer_id
  FROM public.customer_accounts ca
  WHERE ca.auth_user_id = v_uid
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    RETURN v_customer_id;
  END IF;

  SELECT u.email,
         COALESCE(u.phone, u.raw_user_meta_data->>'phone'),
         COALESCE(NULLIF(u.raw_user_meta_data->>'name',''), NULLIF(u.raw_user_meta_data->>'full_name',''))
    INTO v_email, v_phone, v_name
  FROM auth.users u
  WHERE u.id = v_uid;

  -- shadow emails look like <phone>@phone.local
  IF v_phone IS NULL AND v_email LIKE '%@phone.local' THEN
    v_phone := split_part(v_email, '@', 1);
  END IF;

  IF v_phone IS NOT NULL AND v_phone <> '' THEN
    SELECT c.id INTO v_customer_id FROM public.customers c WHERE c.phone = v_phone LIMIT 1;
  END IF;

  IF v_customer_id IS NULL AND v_email IS NOT NULL AND v_email NOT LIKE '%@phone.local' THEN
    SELECT c.id INTO v_customer_id FROM public.customers c WHERE c.email = v_email LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, email, is_active)
    VALUES (
      COALESCE(v_name, split_part(COALESCE(v_email, 'Customer'), '@', 1)),
      COALESCE(NULLIF(v_phone, ''), 'acct-' || left(v_uid::text, 8)),
      NULLIF(v_email, ''),
      true
    )
    RETURNING id INTO v_customer_id;
  END IF;

  INSERT INTO public.customer_accounts (auth_user_id, customer_id, phone, email)
  VALUES (v_uid, v_customer_id, NULLIF(v_phone, ''), NULLIF(v_email, ''))
  ON CONFLICT DO NOTHING;

  SELECT ca.customer_id INTO v_customer_id
  FROM public.customer_accounts ca
  WHERE ca.auth_user_id = v_uid
  LIMIT 1;

  RETURN v_customer_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_my_customer_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_customer_id() TO authenticated;