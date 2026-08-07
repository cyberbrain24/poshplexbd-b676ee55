ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured_sort_order integer NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY updated_at DESC) AS rn
  FROM public.products
  WHERE is_featured = true
)
UPDATE public.products p
SET featured_sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (is_featured, featured_sort_order) WHERE is_featured;