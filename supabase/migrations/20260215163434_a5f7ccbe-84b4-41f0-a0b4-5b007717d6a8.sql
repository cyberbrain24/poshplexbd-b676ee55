
-- Tighten the promo_code_usages INSERT policy
DROP POLICY IF EXISTS "Public can insert promo_code_usages" ON public.promo_code_usages;

-- Only allow inserting promo usages for valid active promo codes
CREATE POLICY "Can insert promo_code_usages for valid promos"
ON public.promo_code_usages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.promo_codes pc
    WHERE pc.id = promo_code_usages.promo_code_id
    AND pc.is_active = true
  )
);
