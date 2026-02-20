
-- Trigger function: sync phone & email from customers → customer_accounts
CREATE OR REPLACE FUNCTION public.sync_customer_to_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a customer's phone or email changes, keep customer_accounts in sync
  IF (OLD.phone IS DISTINCT FROM NEW.phone) OR (OLD.email IS DISTINCT FROM NEW.email) THEN
    UPDATE public.customer_accounts
    SET
      phone = NEW.phone,
      email = NEW.email,
      updated_at = NOW()
    WHERE customer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS trg_sync_customer_to_account ON public.customers;

CREATE TRIGGER trg_sync_customer_to_account
AFTER UPDATE OF phone, email
ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_to_account();
