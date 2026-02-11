
-- Add reward_type to promo_codes (default to discount types based on existing discount_type)
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS reward_type text NOT NULL DEFAULT 'percentage_discount';

-- Add membership reward fields
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS reward_membership_type_id uuid REFERENCES public.customer_types(id) ON DELETE SET NULL;

-- When should membership be awarded: 'paid' or 'delivered'
ALTER TABLE public.promo_codes 
  ADD COLUMN IF NOT EXISTS reward_trigger text NOT NULL DEFAULT 'paid';

-- Migrate existing data: set reward_type based on discount_type
UPDATE public.promo_codes 
SET reward_type = CASE 
  WHEN discount_type = 'percentage' THEN 'percentage_discount'
  WHEN discount_type = 'fixed' THEN 'fixed_discount'
  ELSE 'percentage_discount'
END;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code_active ON public.promo_codes(code, is_active);
