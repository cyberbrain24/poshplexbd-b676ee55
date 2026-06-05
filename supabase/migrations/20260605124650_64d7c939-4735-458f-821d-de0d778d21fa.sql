
CREATE TABLE public.custom_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.custom_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_variants TO authenticated;
GRANT ALL ON public.custom_variants TO service_role;

ALTER TABLE public.custom_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view custom_variants"
  ON public.custom_variants FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert custom_variants"
  ON public.custom_variants FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update custom_variants"
  ON public.custom_variants FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete custom_variants"
  ON public.custom_variants FOR DELETE TO authenticated
  USING (is_admin());

CREATE TRIGGER update_custom_variants_updated_at
  BEFORE UPDATE ON public.custom_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_variants
  ADD COLUMN custom_variant_id UUID NULL REFERENCES public.custom_variants(id) ON DELETE RESTRICT;

CREATE INDEX idx_product_variants_custom_variant_id
  ON public.product_variants(custom_variant_id);
