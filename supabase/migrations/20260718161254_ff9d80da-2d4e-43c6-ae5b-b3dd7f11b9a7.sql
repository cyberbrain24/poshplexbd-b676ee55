ALTER TABLE public.orders DROP COLUMN IF EXISTS promo_code;
ALTER TABLE public.orders DROP COLUMN IF EXISTS promo_code_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS promo_discount;
DROP TABLE IF EXISTS public.promo_code_usages CASCADE;
DROP TABLE IF EXISTS public.promo_codes CASCADE;
DROP FUNCTION IF EXISTS public.increment_promo_usage(uuid);