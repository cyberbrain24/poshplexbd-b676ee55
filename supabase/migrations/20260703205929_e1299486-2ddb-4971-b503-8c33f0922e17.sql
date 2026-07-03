ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE public.categories
SET slug = regexp_replace(regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
WHERE slug IS NULL OR slug = '';

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON public.categories(slug);