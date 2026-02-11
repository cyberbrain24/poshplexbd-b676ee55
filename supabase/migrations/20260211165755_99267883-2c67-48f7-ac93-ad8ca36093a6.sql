
-- 1. Create promo_codes table for Promo & Discount Code Management
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_discount_amount NUMERIC, -- cap for percentage discounts
  min_order_amount NUMERIC DEFAULT 0,
  usage_limit INTEGER, -- null = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_customer_limit INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for promo_codes
CREATE POLICY "Admins can manage promo_codes" ON public.promo_codes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public can view active promo_codes" ON public.promo_codes FOR SELECT USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add shipping_cost column to thanas table for per-thana shipping rates
ALTER TABLE public.thanas ADD COLUMN shipping_cost NUMERIC NOT NULL DEFAULT 120;

-- 3. Add profile_image_url to customers table
ALTER TABLE public.customers ADD COLUMN profile_image_url TEXT;

-- 4. Add promo_code_id to orders for tracking which promo was used
ALTER TABLE public.orders ADD COLUMN promo_code_id UUID REFERENCES public.promo_codes(id);
ALTER TABLE public.orders ADD COLUMN promo_code TEXT;
ALTER TABLE public.orders ADD COLUMN promo_discount NUMERIC DEFAULT 0;

-- 5. Create promo_code_usages table to track per-customer usage
CREATE TABLE public.promo_code_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  order_id UUID REFERENCES public.orders(id),
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_code_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promo_code_usages" ON public.promo_code_usages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Public can insert promo_code_usages" ON public.promo_code_usages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view own promo_code_usages" ON public.promo_code_usages FOR SELECT USING (true);
