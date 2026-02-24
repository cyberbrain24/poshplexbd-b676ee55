
-- Create junction table for many-to-many product ↔ category relationship
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies matching products table pattern
CREATE POLICY "Public can view product_categories"
  ON public.product_categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert product_categories"
  ON public.product_categories FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update product_categories"
  ON public.product_categories FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete product_categories"
  ON public.product_categories FOR DELETE USING (is_admin());

-- Create index for fast lookups
CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);

-- Migrate existing category_id data into junction table
INSERT INTO public.product_categories (product_id, category_id)
SELECT id, category_id FROM public.products WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;
