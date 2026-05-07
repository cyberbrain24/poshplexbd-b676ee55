-- Auto-create CRM customer when a customer_accounts row is inserted/updated without one
CREATE OR REPLACE FUNCTION public.ensure_customer_for_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_name text;
  v_phone text;
  v_email text;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_phone := NEW.phone;
  v_email := NEW.email;

  -- Try to find existing customer by phone
  IF v_phone IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM public.customers WHERE phone = v_phone LIMIT 1;
  END IF;

  -- Try by email
  IF v_customer_id IS NULL AND v_email IS NOT NULL THEN
    SELECT id INTO v_customer_id FROM public.customers WHERE email = v_email LIMIT 1;
  END IF;

  -- Otherwise create a new one using auth user metadata
  IF v_customer_id IS NULL THEN
    SELECT COALESCE(raw_user_meta_data->>'name', 'Customer')
      INTO v_name
      FROM auth.users WHERE id = NEW.auth_user_id;

    INSERT INTO public.customers (name, phone, email, gender, is_active)
    VALUES (
      COALESCE(v_name, 'Customer'),
      COALESCE(v_phone, 'user_' || substr(NEW.auth_user_id::text, 1, 8)),
      v_email,
      'other',
      true
    )
    RETURNING id INTO v_customer_id;
  END IF;

  NEW.customer_id := v_customer_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_customer_for_account ON public.customer_accounts;
CREATE TRIGGER trg_ensure_customer_for_account
BEFORE INSERT OR UPDATE ON public.customer_accounts
FOR EACH ROW
EXECUTE FUNCTION public.ensure_customer_for_account();

-- Backfill existing accounts that have no linked customer
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.customer_accounts WHERE customer_id IS NULL LOOP
    UPDATE public.customer_accounts SET updated_at = now() WHERE id = r.id;
  END LOOP;
END $$;