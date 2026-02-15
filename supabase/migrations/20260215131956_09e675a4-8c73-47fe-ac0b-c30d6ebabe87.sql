
-- Create media_metadata table for SEO fields
CREATE TABLE public.media_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  display_name TEXT,
  seo_slug TEXT,
  alt_text TEXT,
  title_attribute TEXT,
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bucket_id, file_path),
  UNIQUE(seo_slug)
);

-- Enable RLS
ALTER TABLE public.media_metadata ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage media_metadata"
ON public.media_metadata FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Public read for alt text / SEO consumption
CREATE POLICY "Public can read media_metadata"
ON public.media_metadata FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_media_metadata_updated_at
BEFORE UPDATE ON public.media_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
