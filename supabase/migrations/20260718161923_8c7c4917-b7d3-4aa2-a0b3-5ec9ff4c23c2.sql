ALTER TABLE public.product_variants DROP COLUMN IF EXISTS custom_variant_id;
DROP TABLE IF EXISTS public.custom_variants CASCADE;