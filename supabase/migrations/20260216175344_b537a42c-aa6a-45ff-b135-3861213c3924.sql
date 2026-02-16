-- Add image_url column to product_variants for variant-level image assignment
ALTER TABLE public.product_variants
ADD COLUMN image_url text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.product_variants.image_url IS 'URL of variant-specific image from media library';