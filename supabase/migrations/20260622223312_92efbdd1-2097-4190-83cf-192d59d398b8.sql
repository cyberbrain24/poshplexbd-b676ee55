
ALTER TABLE public.site_settings
  DROP COLUMN IF EXISTS gemini_api_key,
  DROP COLUMN IF EXISTS gemini_enabled,
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS openai_enabled,
  DROP COLUMN IF EXISTS anthropic_api_key,
  DROP COLUMN IF EXISTS anthropic_enabled,
  DROP COLUMN IF EXISTS openrouter_api_key,
  DROP COLUMN IF EXISTS openrouter_enabled;
