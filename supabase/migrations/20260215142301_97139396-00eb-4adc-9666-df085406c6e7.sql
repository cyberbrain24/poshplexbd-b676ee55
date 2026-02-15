
-- Create customer_addresses table for multi-address support
CREATE TABLE public.customer_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  address TEXT NOT NULL,
  division_id UUID REFERENCES public.divisions(id),
  thana_id UUID REFERENCES public.thanas(id),
  postal_code TEXT,
  is_default_shipping BOOLEAN NOT NULL DEFAULT false,
  is_default_billing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage customer_addresses"
  ON public.customer_addresses FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Customers can view their own addresses via customer_accounts link
CREATE POLICY "Customers can view own addresses"
  ON public.customer_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_accounts ca
      WHERE ca.customer_id = customer_addresses.customer_id
      AND ca.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert own addresses"
  ON public.customer_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_accounts ca
      WHERE ca.customer_id = customer_addresses.customer_id
      AND ca.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update own addresses"
  ON public.customer_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_accounts ca
      WHERE ca.customer_id = customer_addresses.customer_id
      AND ca.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can delete own addresses"
  ON public.customer_addresses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_accounts ca
      WHERE ca.customer_id = customer_addresses.customer_id
      AND ca.auth_user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default shipping/billing per customer
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_default_shipping = true THEN
    UPDATE public.customer_addresses
    SET is_default_shipping = false
    WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_default_shipping = true;
  END IF;
  IF NEW.is_default_billing = true THEN
    UPDATE public.customer_addresses
    SET is_default_billing = false
    WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_default_billing = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();
