-- Add new inventory transaction types for direct-sync model
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'sale';
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'cancellation';
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'write_off';
ALTER TYPE public.inventory_transaction_type ADD VALUE IF NOT EXISTS 'return';

-- Create index for faster inventory lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants(stock) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant ON public.inventory_transactions(variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order ON public.inventory_transactions(order_id) WHERE order_id IS NOT NULL;