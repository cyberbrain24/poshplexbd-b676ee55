
-- Create independent inventory_products table
CREATE TABLE public.inventory_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT 'pcs',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at_inventory_products
  BEFORE UPDATE ON public.inventory_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.inventory_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory_products" ON public.inventory_products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add inventory_product_id to inventory_entry_items
ALTER TABLE public.inventory_entry_items 
  ADD COLUMN inventory_product_id UUID REFERENCES public.inventory_products(id);

-- Drop the old stock trigger that references products/variants
DROP TRIGGER IF EXISTS update_variant_stock_on_inventory ON public.inventory_entry_items;

-- Create new stock trigger for inventory_products
CREATE OR REPLACE FUNCTION public.update_inventory_product_stock()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.inventory_product_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.inventory_products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.inventory_product_id;
      ELSE
        UPDATE public.inventory_products SET current_stock = GREATEST(current_stock - NEW.quantity, 0) WHERE id = NEW.inventory_product_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old
    IF OLD.inventory_product_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.inventory_products SET current_stock = current_stock - OLD.quantity WHERE id = OLD.inventory_product_id;
      ELSE
        UPDATE public.inventory_products SET current_stock = current_stock + OLD.quantity WHERE id = OLD.inventory_product_id;
      END IF;
    END IF;
    -- Apply new
    IF NEW.inventory_product_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.inventory_products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.inventory_product_id;
      ELSE
        UPDATE public.inventory_products SET current_stock = GREATEST(current_stock - NEW.quantity, 0) WHERE id = NEW.inventory_product_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.inventory_product_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.inventory_products SET current_stock = current_stock - OLD.quantity WHERE id = OLD.inventory_product_id;
      ELSE
        UPDATE public.inventory_products SET current_stock = current_stock + OLD.quantity WHERE id = OLD.inventory_product_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$function$;

CREATE TRIGGER update_inventory_product_stock_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.inventory_entry_items
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_product_stock();
