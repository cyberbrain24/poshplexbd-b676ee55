
-- Add stock_quantity to product_variants for inventory tracking
ALTER TABLE public.product_variants
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 0;

-- Add low_stock_threshold for inventory alerts
ALTER TABLE public.product_variants
ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 5;

-- Add index for quick out-of-stock queries
CREATE INDEX idx_product_variants_stock ON public.product_variants (stock_quantity) WHERE is_active = true;

-- Add a check constraint to prevent negative stock
ALTER TABLE public.product_variants
ADD CONSTRAINT stock_quantity_non_negative CHECK (stock_quantity >= 0);
