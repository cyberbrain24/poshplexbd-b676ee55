
-- 1) Attribute definitions
CREATE TABLE public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product_attributes" ON public.product_attributes FOR SELECT USING (true);
CREATE POLICY "Admins insert product_attributes" ON public.product_attributes FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update product_attributes" ON public.product_attributes FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins delete product_attributes" ON public.product_attributes FOR DELETE TO authenticated USING (is_admin());

-- 2) Attribute values
CREATE TABLE public.product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, value)
);
CREATE INDEX idx_pav_attribute ON public.product_attribute_values(attribute_id);
GRANT SELECT ON public.product_attribute_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attribute_values TO authenticated;
GRANT ALL ON public.product_attribute_values TO service_role;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product_attribute_values" ON public.product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins insert product_attribute_values" ON public.product_attribute_values FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update product_attribute_values" ON public.product_attribute_values FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins delete product_attribute_values" ON public.product_attribute_values FOR DELETE TO authenticated USING (is_admin());

-- 3) Which attributes are applied to a product
CREATE TABLE public.product_applied_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, attribute_id)
);
CREATE INDEX idx_paa_product ON public.product_applied_attributes(product_id);
GRANT SELECT ON public.product_applied_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_applied_attributes TO authenticated;
GRANT ALL ON public.product_applied_attributes TO service_role;
ALTER TABLE public.product_applied_attributes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product_applied_attributes" ON public.product_applied_attributes FOR SELECT USING (true);
CREATE POLICY "Admins insert product_applied_attributes" ON public.product_applied_attributes FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update product_applied_attributes" ON public.product_applied_attributes FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins delete product_applied_attributes" ON public.product_applied_attributes FOR DELETE TO authenticated USING (is_admin());

-- 4) Variant ↔ attribute value mapping (one value per attribute per variant)
CREATE TABLE public.product_variant_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES public.product_attributes(id) ON DELETE CASCADE,
  attribute_value_id uuid NOT NULL REFERENCES public.product_attribute_values(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(variant_id, attribute_id)
);
CREATE INDEX idx_pvav_variant ON public.product_variant_attribute_values(variant_id);
CREATE INDEX idx_pvav_value ON public.product_variant_attribute_values(attribute_value_id);
GRANT SELECT ON public.product_variant_attribute_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variant_attribute_values TO authenticated;
GRANT ALL ON public.product_variant_attribute_values TO service_role;
ALTER TABLE public.product_variant_attribute_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product_variant_attribute_values" ON public.product_variant_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins insert product_variant_attribute_values" ON public.product_variant_attribute_values FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update product_variant_attribute_values" ON public.product_variant_attribute_values FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "Admins delete product_variant_attribute_values" ON public.product_variant_attribute_values FOR DELETE TO authenticated USING (is_admin());

-- updated_at triggers (reuse existing function)
CREATE TRIGGER trg_product_attributes_updated_at BEFORE UPDATE ON public.product_attributes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_product_attribute_values_updated_at BEFORE UPDATE ON public.product_attribute_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
