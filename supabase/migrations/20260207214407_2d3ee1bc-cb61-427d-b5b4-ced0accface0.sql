-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;

-- Create or replace the function to generate short order numbers
CREATE OR REPLACE FUNCTION generate_short_order_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate order number like "PO-12345" (max 5 digits)
  NEW.order_number := 'PO-' || nextval('order_number_seq')::text;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS set_order_number ON orders;

-- Create trigger to auto-generate order number on insert
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_short_order_number();