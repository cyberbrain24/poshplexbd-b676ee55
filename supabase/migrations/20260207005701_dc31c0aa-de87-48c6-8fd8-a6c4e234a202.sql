-- Create pages table for dynamic CMS
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT, -- HTML content (sanitized on frontend)
  excerpt TEXT, -- Short description for previews
  cover_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  page_type TEXT NOT NULL DEFAULT 'custom' CHECK (page_type IN ('system', 'custom')),
  is_protected BOOLEAN NOT NULL DEFAULT false, -- System pages cannot be deleted
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_pages_status ON public.pages(status);
CREATE INDEX idx_pages_type ON public.pages(page_type);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view published pages"
ON public.pages FOR SELECT
USING (status = 'published' OR is_admin());

CREATE POLICY "Admins can insert pages"
ON public.pages FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update pages"
ON public.pages FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete non-protected pages"
ON public.pages FOR DELETE
USING (is_admin() AND is_protected = false);

-- Auto-update timestamp trigger
CREATE TRIGGER update_pages_updated_at
BEFORE UPDATE ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-register SEO when page is created/updated
CREATE OR REPLACE FUNCTION public.auto_register_page_seo()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.upsert_seo_path(
    '/' || NEW.slug,
    'page',
    NEW.id,
    false,
    'WebPage'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_register_page_seo_trigger
AFTER INSERT OR UPDATE OF slug ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.auto_register_page_seo();

-- Seed some system pages (protected)
INSERT INTO public.pages (title, slug, content, status, page_type, is_protected, sort_order) VALUES
('Home', 'home', '<p>Welcome to Poshplex</p>', 'published', 'system', true, 0),
('About Us', 'about-us', '<h2>Our Story</h2><p>Poshplex is a premium fashion destination...</p>', 'published', 'system', true, 1),
('Contact', 'contact', '<h2>Get in Touch</h2><p>We''d love to hear from you.</p>', 'published', 'custom', false, 2);