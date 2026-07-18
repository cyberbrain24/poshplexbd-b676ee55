-- Drop attribute junction and definition tables
DROP TABLE IF EXISTS public.product_variant_attribute_values CASCADE;
DROP TABLE IF EXISTS public.product_applied_attributes CASCADE;
DROP TABLE IF EXISTS public.product_attribute_values CASCADE;
DROP TABLE IF EXISTS public.product_attributes CASCADE;

-- Drop material/brand/care FK columns
ALTER TABLE public.product_variants DROP COLUMN IF EXISTS material_id;
ALTER TABLE public.shared_variants DROP CONSTRAINT IF EXISTS shared_variants_color_id_size_id_material_id_key;
ALTER TABLE public.shared_variants DROP COLUMN IF EXISTS material_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS brand_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS care_instruction_id;

-- Drop tables
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.care_instructions CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;

-- Recreate shared_variants uniqueness without material
ALTER TABLE public.shared_variants
  ADD CONSTRAINT shared_variants_color_id_size_id_key UNIQUE (color_id, size_id);