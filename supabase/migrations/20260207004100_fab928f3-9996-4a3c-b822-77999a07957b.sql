-- Create site_settings table (single-record design)
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Branding & Identity
  site_name TEXT NOT NULL DEFAULT 'Poshplex',
  tagline TEXT,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Navigation (JSON arrays for flexibility)
  header_menu JSONB NOT NULL DEFAULT '[
    {"label": "Shop", "path": "/category/all"},
    {"label": "New Arrivals", "path": "/category/new"},
    {"label": "Blog", "path": "/blog"},
    {"label": "About", "path": "/about/our-story"}
  ]'::jsonb,
  
  -- Footer content
  footer_copyright TEXT DEFAULT '© 2025 Poshplex. All rights reserved.',
  footer_contact_email TEXT,
  footer_contact_phone TEXT,
  footer_address TEXT,
  
  -- Social media links
  social_links JSONB NOT NULL DEFAULT '{
    "instagram": "",
    "facebook": "",
    "twitter": "",
    "pinterest": "",
    "youtube": "",
    "tiktok": ""
  }'::jsonb,
  
  -- Footer columns (flexible link groups)
  footer_columns JSONB NOT NULL DEFAULT '[
    {
      "title": "Shop",
      "links": [
        {"label": "All Products", "path": "/category/all"},
        {"label": "New Arrivals", "path": "/category/new"}
      ]
    },
    {
      "title": "About",
      "links": [
        {"label": "Our Story", "path": "/about/our-story"},
        {"label": "Sustainability", "path": "/about/sustainability"}
      ]
    },
    {
      "title": "Support",
      "links": [
        {"label": "Size Guide", "path": "/about/size-guide"},
        {"label": "Customer Care", "path": "/about/customer-care"},
        {"label": "Store Locator", "path": "/about/store-locator"}
      ]
    },
    {
      "title": "Legal",
      "links": [
        {"label": "Privacy Policy", "path": "/privacy-policy"},
        {"label": "Terms of Service", "path": "/terms-of-service"}
      ]
    }
  ]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure single record
  CONSTRAINT single_settings_row CHECK (id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Public can read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site_settings"
  ON public.site_settings
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.site_settings (
  site_name,
  tagline,
  footer_copyright,
  footer_contact_email
) VALUES (
  'Poshplex',
  'Premium Fashion & Jewelry',
  '© 2025 Poshplex. All rights reserved.',
  'hello@poshplex.com'
);

-- Function to ensure only one settings row exists
CREATE OR REPLACE FUNCTION public.ensure_single_site_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.site_settings) >= 1 THEN
    RAISE EXCEPTION 'Only one site_settings row is allowed. Use UPDATE instead of INSERT.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_site_settings_trigger
  BEFORE INSERT ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_site_settings();