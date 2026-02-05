-- Create blog_categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT,
  excerpt TEXT,
  cover_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMP WITH TIME ZONE,
  -- SEO Columns
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog_post_products junction table (Shop The Look)
CREATE TABLE public.blog_post_products (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, product_id)
);

-- Enable RLS on all tables
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view blog_categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert blog_categories" ON public.blog_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update blog_categories" ON public.blog_categories FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete blog_categories" ON public.blog_categories FOR DELETE USING (true);

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view published blog_posts" ON public.blog_posts FOR SELECT USING (status = 'published' OR true);
CREATE POLICY "Authenticated users can insert blog_posts" ON public.blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update blog_posts" ON public.blog_posts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete blog_posts" ON public.blog_posts FOR DELETE USING (true);

-- RLS Policies for blog_post_products
CREATE POLICY "Anyone can view blog_post_products" ON public.blog_post_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert blog_post_products" ON public.blog_post_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update blog_post_products" ON public.blog_post_products FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete blog_post_products" ON public.blog_post_products FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories(slug);

-- Add updated_at triggers
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();