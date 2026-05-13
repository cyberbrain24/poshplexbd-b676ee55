-- BLOG CATEGORIES
CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);
CREATE INDEX idx_blog_categories_active ON public.blog_categories(is_active, sort_order);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active blog_categories" ON public.blog_categories
  FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admins manage blog_categories" ON public.blog_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOG POSTS
CREATE TYPE public.blog_post_status AS ENUM ('draft', 'published', 'scheduled');

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  cover_image_alt TEXT,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_name TEXT NOT NULL DEFAULT 'POSHPLEX',
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  view_count INTEGER NOT NULL DEFAULT 0,
  -- Advanced SEO
  focus_keyword TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC) WHERE status = 'published';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published blog_posts" ON public.blog_posts
  FOR SELECT USING (
    (status = 'published' AND published_at IS NOT NULL AND published_at <= now())
    OR public.is_admin()
  );
CREATE POLICY "Admins manage blog_posts" ON public.blog_posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOG POST <-> CATEGORIES junction
CREATE TABLE public.blog_post_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.blog_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, category_id)
);

CREATE INDEX idx_blog_post_categories_post ON public.blog_post_categories(post_id);
CREATE INDEX idx_blog_post_categories_category ON public.blog_post_categories(category_id);

ALTER TABLE public.blog_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view blog_post_categories" ON public.blog_post_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins manage blog_post_categories" ON public.blog_post_categories
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Public RPC to increment view count (no auth required, safe atomic increment)
CREATE OR REPLACE FUNCTION public.increment_blog_post_views(p_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts
  SET view_count = view_count + 1
  WHERE slug = p_slug
    AND status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now();
$$;

GRANT EXECUTE ON FUNCTION public.increment_blog_post_views(TEXT) TO anon, authenticated;