ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS openrouter_api_key text,
  ADD COLUMN IF NOT EXISTS openrouter_enabled boolean NOT NULL DEFAULT true;