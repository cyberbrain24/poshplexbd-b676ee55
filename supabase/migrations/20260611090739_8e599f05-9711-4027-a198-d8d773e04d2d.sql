CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  subtitle text,
  description text,
  image_url text,
  display_style text NOT NULL DEFAULT 'banner',
  action_type text NOT NULL DEFAULT 'popup',
  action_value text,
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  placements text[] NOT NULL DEFAULT '{}',
  category_filter uuid[],
  priority integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  dismissible boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  cta_label text,
  bg_color text,
  text_color text,
  views integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active in-schedule promotions"
  ON public.promotions FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "Admins can view all promotions"
  ON public.promotions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX promotions_active_idx ON public.promotions (is_active, starts_at, ends_at);
CREATE INDEX promotions_placements_idx ON public.promotions USING GIN (placements);
CREATE INDEX promotions_priority_idx ON public.promotions (priority DESC);

CREATE OR REPLACE FUNCTION public.increment_promotion_view(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promotions SET views = views + 1 WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_promotion_click(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.promotions SET clicks = clicks + 1 WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_promotion_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promotion_click(uuid) TO anon, authenticated;