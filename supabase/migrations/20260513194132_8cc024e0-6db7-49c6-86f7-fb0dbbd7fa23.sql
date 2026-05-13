CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_path TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL DEFAULT 'static',
  entity_id UUID,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  og_type TEXT DEFAULT 'website',
  twitter_card TEXT DEFAULT 'summary_large_image',
  focus_keyword TEXT,
  keywords TEXT[],
  robots_index BOOLEAN NOT NULL DEFAULT true,
  robots_follow BOOLEAN NOT NULL DEFAULT true,
  json_ld JSONB,
  sitemap_priority NUMERIC(2,1) DEFAULT 0.5,
  sitemap_changefreq TEXT DEFAULT 'weekly',
  sitemap_include BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_route_path ON public.seo_pages(route_path);
CREATE INDEX IF NOT EXISTS idx_seo_pages_entity ON public.seo_pages(entity_type, entity_id);

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view seo_pages"
  ON public.seo_pages FOR SELECT
  USING (true);

CREATE POLICY "Admins manage seo_pages"
  ON public.seo_pages FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_seo_pages_updated_at
  BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();