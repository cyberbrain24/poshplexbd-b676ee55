-- =============================================
-- CLEANUP: Remove unused database tables and functions
-- These tables have no frontend implementation
-- =============================================

-- 1. Drop unused database functions first (they may reference tables)
DROP FUNCTION IF EXISTS public.auto_register_blog_seo() CASCADE;
DROP FUNCTION IF EXISTS public.auto_register_page_seo() CASCADE;

-- 2. Drop blog-related tables (no blog feature implemented)
DROP TABLE IF EXISTS public.blog_post_products;
DROP TABLE IF EXISTS public.blog_posts;
DROP TABLE IF EXISTS public.blog_categories;

-- 3. Drop messaging-related tables (no messaging feature implemented)
DROP TABLE IF EXISTS public.sms_birthday_logs;
DROP TABLE IF EXISTS public.whatsapp_birthday_logs;
DROP TABLE IF EXISTS public.whatsapp_button_clicks;

-- 4. Drop pages table (CMS not fully implemented)
DROP TABLE IF EXISTS public.pages;