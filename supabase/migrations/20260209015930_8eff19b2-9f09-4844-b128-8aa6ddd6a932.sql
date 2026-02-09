-- Add image_url column to categories table
ALTER TABLE public.categories 
ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.categories.image_url IS 'URL to category image stored in blob storage';