ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS reviews_featured_idx ON public.reviews(is_featured) WHERE is_featured = true;