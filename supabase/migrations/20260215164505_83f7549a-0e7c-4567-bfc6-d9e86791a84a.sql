
-- Create site_settings table for GA4 and other settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ga4_enabled boolean NOT NULL DEFAULT false,
  ga4_measurement_id text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage site_settings"
  ON public.site_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public can read settings (needed for frontend GA4 injection)
CREATE POLICY "Public can read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Trigger to prevent multiple rows
CREATE TRIGGER enforce_single_site_settings
  BEFORE INSERT ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_site_settings();

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.site_settings (ga4_enabled, ga4_measurement_id) VALUES (false, null);
