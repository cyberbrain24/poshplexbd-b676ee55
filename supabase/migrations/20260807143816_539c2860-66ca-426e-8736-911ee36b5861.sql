DROP FUNCTION IF EXISTS public.upsert_checkout_customer(text, text, text, text, text, uuid, uuid);

ALTER TABLE public.customers DROP COLUMN IF EXISTS gender;
ALTER TABLE public.customers DROP COLUMN IF EXISTS birthdate;

CREATE OR REPLACE FUNCTION public.upsert_checkout_customer(
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL::text,
  p_address text DEFAULT NULL::text,
  p_division_id uuid DEFAULT NULL::uuid,
  p_thana_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer_id UUID;
BEGIN
  IF p_phone IS NULL OR p_phone = '' THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE phone = p_phone
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    UPDATE public.customers SET
      name = COALESCE(NULLIF(p_name, ''), name),
      email = COALESCE(NULLIF(p_email, ''), email),
      address = COALESCE(NULLIF(p_address, ''), address),
      division_id = COALESCE(p_division_id, division_id),
      thana_id = COALESCE(p_thana_id, thana_id),
      updated_at = NOW()
    WHERE id = v_customer_id;
  ELSE
    INSERT INTO public.customers (name, phone, email, address, division_id, thana_id, is_active)
    VALUES (p_name, p_phone, p_email, p_address, p_division_id, p_thana_id, true)
    RETURNING id INTO v_customer_id;
  END IF;

  RETURN v_customer_id;
END;
$function$;