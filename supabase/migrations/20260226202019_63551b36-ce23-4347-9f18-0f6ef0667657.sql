
ALTER TABLE public.shared_variants
ADD COLUMN subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL DEFAULT NULL;

COMMENT ON COLUMN public.shared_variants.subcategory_id IS 'Subcategory (child category) for the shared variant blank';
