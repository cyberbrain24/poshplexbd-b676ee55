ALTER TABLE public.chatbot_settings
  ADD COLUMN IF NOT EXISTS text_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS image_model text NOT NULL DEFAULT 'google/gemini-2.5-flash';

UPDATE public.chatbot_settings
SET text_model = COALESCE(NULLIF(model, ''), 'google/gemini-2.5-flash')
WHERE text_model = 'google/gemini-2.5-flash';