
-- Independent inventory categories table
CREATE TABLE public.inventory_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory_categories" ON public.inventory_categories
  FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can view inventory_categories" ON public.inventory_categories
  FOR SELECT TO public USING (true);

-- Drop old FK references to main categories on inventory_products
ALTER TABLE public.inventory_products
  DROP CONSTRAINT IF EXISTS inventory_products_category_id_fkey,
  DROP CONSTRAINT IF EXISTS inventory_products_subcategory_id_fkey;

-- Add new FK references to inventory_categories
ALTER TABLE public.inventory_products
  ADD CONSTRAINT inventory_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  ADD CONSTRAINT inventory_products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL;
