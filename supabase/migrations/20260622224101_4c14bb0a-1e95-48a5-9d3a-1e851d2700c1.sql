DROP TABLE IF EXISTS public.blog_post_categories CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.blog_categories CASCADE;
DROP FUNCTION IF EXISTS public.increment_blog_post_views(text) CASCADE;
DROP TYPE IF EXISTS public.blog_post_status CASCADE;
DROP TABLE IF EXISTS public.seo_pages CASCADE;