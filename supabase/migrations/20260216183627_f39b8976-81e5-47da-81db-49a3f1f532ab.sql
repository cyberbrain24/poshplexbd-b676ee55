
-- Site branding configuration table (single row)
CREATE TABLE public.site_branding (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name text NOT NULL DEFAULT 'POSHPLEX',
  slogan text NOT NULL DEFAULT 'BE POSH WITH POSHPLEX',
  logo_url text,
  desktop_hero_url text,
  mobile_hero_url text,
  hero_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only one row allowed
CREATE OR REPLACE FUNCTION public.ensure_single_site_branding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.site_branding) >= 1 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only one site_branding row is allowed. Use UPDATE instead.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_site_branding_trigger
BEFORE INSERT ON public.site_branding
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_site_branding();

-- Enable RLS
ALTER TABLE public.site_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read site_branding"
ON public.site_branding FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site_branding"
ON public.site_branding FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Seed default row
INSERT INTO public.site_branding (site_name, slogan) VALUES ('POSHPLEX', 'BE POSH WITH POSHPLEX');
