ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS openai_api_key text,
  ADD COLUMN IF NOT EXISTS openai_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS anthropic_api_key text,
  ADD COLUMN IF NOT EXISTS anthropic_enabled boolean NOT NULL DEFAULT true;