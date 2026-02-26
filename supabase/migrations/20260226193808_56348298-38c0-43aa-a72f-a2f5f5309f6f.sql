
-- 1. Create shared_variants table
CREATE TABLE public.shared_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
  size_id UUID REFERENCES public.sizes(id) ON DELETE SET NULL,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  sku TEXT NOT NULL DEFAULT '',
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(color_id, size_id, material_id)
);

-- 2. Add shared_variant_id to product_variants
ALTER TABLE public.product_variants
  ADD COLUMN shared_variant_id UUID REFERENCES public.shared_variants(id) ON DELETE SET NULL;

-- 3. Add shared_variant_id to inventory_entry_items, make product_id/variant_id nullable
ALTER TABLE public.inventory_entry_items
  ADD COLUMN shared_variant_id UUID REFERENCES public.shared_variants(id) ON DELETE SET NULL,
  ALTER COLUMN product_id DROP NOT NULL,
  ALTER COLUMN variant_id DROP NOT NULL;

-- 4. RLS for shared_variants
ALTER TABLE public.shared_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shared_variants" ON public.shared_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view shared_variants" ON public.shared_variants
  FOR SELECT USING (true);

-- 5. Updated at trigger for shared_variants
CREATE TRIGGER set_updated_at_shared_variants
  BEFORE UPDATE ON public.shared_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Update stock trigger to handle shared variants
CREATE OR REPLACE FUNCTION public.update_variant_stock_on_inventory()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.shared_variant_id IS NOT NULL THEN
      -- Shared variant stock
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.shared_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.shared_variant_id;
      ELSE
        UPDATE public.shared_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.shared_variant_id;
      END IF;
    ELSIF NEW.variant_id IS NOT NULL THEN
      -- Per-product variant stock (existing behavior)
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.product_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.variant_id;
      ELSE
        UPDATE public.product_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.variant_id;
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse old
    IF OLD.shared_variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.shared_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.shared_variant_id;
      ELSE
        UPDATE public.shared_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.shared_variant_id;
      END IF;
    ELSIF OLD.variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.product_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.variant_id;
      ELSE
        UPDATE public.product_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.variant_id;
      END IF;
    END IF;
    -- Apply new
    IF NEW.shared_variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.shared_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.shared_variant_id;
      ELSE
        UPDATE public.shared_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.shared_variant_id;
      END IF;
    ELSIF NEW.variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = NEW.entry_id) = 'in' THEN
        UPDATE public.product_variants SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.variant_id;
      ELSE
        UPDATE public.product_variants SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0) WHERE id = NEW.variant_id;
      END IF;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.shared_variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.shared_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.shared_variant_id;
      ELSE
        UPDATE public.shared_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.shared_variant_id;
      END IF;
    ELSIF OLD.variant_id IS NOT NULL THEN
      IF (SELECT type FROM public.inventory_entries WHERE id = OLD.entry_id) = 'in' THEN
        UPDATE public.product_variants SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.variant_id;
      ELSE
        UPDATE public.product_variants SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.variant_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
END;
$function$;
