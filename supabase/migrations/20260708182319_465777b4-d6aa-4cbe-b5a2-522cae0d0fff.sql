DROP TABLE IF EXISTS public.promotions CASCADE;
DROP FUNCTION IF EXISTS public.increment_promotion_view(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.increment_promotion_click(uuid) CASCADE;