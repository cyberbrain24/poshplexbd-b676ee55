
-- Drop triggers with correct names
DROP TRIGGER IF EXISTS auto_register_product_seo_trigger ON public.products;
DROP TRIGGER IF EXISTS auto_register_category_seo_trigger ON public.categories;
DROP TRIGGER IF EXISTS update_seo_metadata_updated_at ON public.seo_metadata;

-- Drop functions with CASCADE
DROP FUNCTION IF EXISTS public.auto_register_product_seo() CASCADE;
DROP FUNCTION IF EXISTS public.auto_register_category_seo() CASCADE;
DROP FUNCTION IF EXISTS public.upsert_seo_path(text, text, uuid, boolean, text) CASCADE;

-- Drop table
DROP TABLE IF EXISTS public.seo_metadata CASCADE;
