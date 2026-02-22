
-- Inventory entries (header for each in/out batch)
CREATE TABLE public.inventory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  account_id UUID REFERENCES public.accounts(id),
  category_id UUID REFERENCES public.transaction_categories(id),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory entry line items
CREATE TABLE public.inventory_entry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.inventory_entries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_entry_items ENABLE ROW LEVEL SECURITY;

-- RLS policies (admin only)
CREATE POLICY "Admins can manage inventory_entries" ON public.inventory_entries FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins can manage inventory_entry_items" ON public.inventory_entry_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Trigger to update stock_quantity on product_variants
CREATE OR REPLACE FUNCTION public.update_variant_stock_on_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get entry type
    IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
      UPDATE public.product_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.variant_id;
    ELSE
      UPDATE public.product_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.variant_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old
    IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
      UPDATE public.product_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.variant_id;
    ELSE
      UPDATE public.product_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.variant_id;
    END IF;
    -- Apply new
    IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
      UPDATE public.product_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.variant_id;
    ELSE
      UPDATE public.product_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.variant_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse
    IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
      UPDATE public.product_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.variant_id;
    ELSE
      UPDATE public.product_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.variant_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_inventory_stock_update
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_entry_items
FOR EACH ROW EXECUTE FUNCTION public.update_variant_stock_on_inventory();

-- Updated_at trigger
CREATE TRIGGER update_inventory_entries_updated_at
BEFORE UPDATE ON public.inventory_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
