-- Create the Universal SEO Metadata table
CREATE TABLE public.seo_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT[],
  og_image TEXT,
  is_dynamic BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT, -- 'product', 'blog', 'category', 'custom'
  entity_id UUID,
  canonical_url TEXT,
  no_index BOOLEAN NOT NULL DEFAULT false,
  json_ld_type TEXT, -- 'Product', 'Article', 'CollectionPage', etc.
  priority NUMERIC(2,1) DEFAULT 0.5, -- sitemap priority
  change_frequency TEXT DEFAULT 'weekly', -- sitemap changefreq
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_seo_metadata_page_path ON public.seo_metadata(page_path);
CREATE INDEX idx_seo_metadata_entity ON public.seo_metadata(entity_type, entity_id);
CREATE INDEX idx_seo_metadata_no_index ON public.seo_metadata(no_index) WHERE no_index = false;

-- Enable RLS
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage seo_metadata"
  ON public.seo_metadata
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Public can read seo_metadata"
  ON public.seo_metadata
  FOR SELECT
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_seo_metadata_updated_at
  BEFORE UPDATE ON public.seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-register SEO paths
CREATE OR REPLACE FUNCTION public.upsert_seo_path(
  p_page_path TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_is_dynamic BOOLEAN DEFAULT true,
  p_json_ld_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.seo_metadata (page_path, entity_type, entity_id, is_dynamic, json_ld_type)
  VALUES (p_page_path, p_entity_type, p_entity_id, p_is_dynamic, p_json_ld_type)
  ON CONFLICT (page_path) DO UPDATE SET
    entity_type = COALESCE(EXCLUDED.entity_type, seo_metadata.entity_type),
    entity_id = COALESCE(EXCLUDED.entity_id, seo_metadata.entity_id),
    updated_at = now()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Auto-register products when created/updated
CREATE OR REPLACE FUNCTION public.auto_register_product_seo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_seo_path(
    '/product/' || NEW.id,
    'product',
    NEW.id,
    true,
    'Product'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_register_product_seo_trigger
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_product_seo();

-- Auto-register blog posts
CREATE OR REPLACE FUNCTION public.auto_register_blog_seo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_seo_path(
    '/blog/' || NEW.slug,
    'blog',
    NEW.id,
    true,
    'Article'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_register_blog_seo_trigger
  AFTER INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_blog_seo();

-- Auto-register categories
CREATE OR REPLACE FUNCTION public.auto_register_category_seo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.upsert_seo_path(
    '/category/' || LOWER(REPLACE(NEW.name, ' ', '-')),
    'category',
    NEW.id,
    true,
    'CollectionPage'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_register_category_seo_trigger
  AFTER INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_category_seo();

-- Seed static pages
INSERT INTO public.seo_metadata (page_path, is_dynamic, json_ld_type, priority, change_frequency) VALUES
  ('/', false, 'WebSite', 1.0, 'daily'),
  ('/blog', false, 'Blog', 0.8, 'daily'),
  ('/about/our-story', false, 'AboutPage', 0.6, 'monthly'),
  ('/about/sustainability', false, 'WebPage', 0.5, 'monthly'),
  ('/about/size-guide', false, 'WebPage', 0.5, 'monthly'),
  ('/about/customer-care', false, 'WebPage', 0.5, 'monthly'),
  ('/about/store-locator', false, 'LocalBusiness', 0.5, 'monthly'),
  ('/privacy-policy', false, 'WebPage', 0.3, 'yearly'),
  ('/terms-of-service', false, 'WebPage', 0.3, 'yearly')
ON CONFLICT (page_path) DO NOTHING;