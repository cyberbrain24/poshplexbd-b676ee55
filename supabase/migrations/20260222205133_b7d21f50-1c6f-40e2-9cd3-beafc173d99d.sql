
-- Add missing pixel configuration columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS meta_test_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_advanced_matching boolean NOT NULL DEFAULT true;
