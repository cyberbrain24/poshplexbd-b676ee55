ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS thumb_url TEXT,
  ADD COLUMN IF NOT EXISTS medium_url TEXT;