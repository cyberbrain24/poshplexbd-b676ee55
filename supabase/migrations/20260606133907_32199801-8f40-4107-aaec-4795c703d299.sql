ALTER TABLE public.reviews ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_customer_id_product_id_key;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_name text;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_customer_product_unique
  ON public.reviews(customer_id, product_id)
  WHERE customer_id IS NOT NULL;