-- Remove inventory system completely

-- 1. Drop the inventory_transactions table
DROP TABLE IF EXISTS public.inventory_transactions CASCADE;

-- 2. Drop the inventory transaction type enum
DROP TYPE IF EXISTS public.inventory_transaction_type CASCADE;

-- 3. Remove stock-related columns from product_variants
ALTER TABLE public.product_variants 
  DROP COLUMN IF EXISTS stock,
  DROP COLUMN IF EXISTS available_stock,
  DROP COLUMN IF EXISTS reserved_stock;

-- 4. Remove inventory route from orders module
UPDATE public.system_modules 
SET routes = ARRAY['/admin/orders', '/admin/payment-methods']::text[]
WHERE module_key = 'orders';