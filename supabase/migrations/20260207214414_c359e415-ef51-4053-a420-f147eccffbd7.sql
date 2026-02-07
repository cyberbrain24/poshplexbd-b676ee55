-- Fix function search path for security
CREATE OR REPLACE FUNCTION generate_short_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'PO-' || nextval('public.order_number_seq')::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;