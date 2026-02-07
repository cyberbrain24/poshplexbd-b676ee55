-- ============================================================
-- DATABASE SCHEMA HARDENING - 10/10 Quality (Fixed)
-- ============================================================

-- 1. Add unique constraints where appropriate
-- Promo usage: one promo code per customer (simple version)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_usage_customer_code 
ON public.promo_usages (customer_id, promo_code);

-- Unique SKU per product variant
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_sku_unique 
ON public.product_variants (sku) WHERE sku IS NOT NULL AND sku != '';

-- Unique product SKU
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique 
ON public.products (sku) WHERE sku IS NOT NULL AND sku != '';

-- One main image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_main_unique 
ON public.product_images (product_id) WHERE is_main = true;

-- Customer phone uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique 
ON public.customers (phone);

-- Category name uniqueness within parent
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_parent_unique 
ON public.categories (LOWER(name), COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Brand name uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_brands_name_unique 
ON public.brands (LOWER(name));

-- Color name uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_colors_name_unique 
ON public.colors (LOWER(name));

-- Size label uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_sizes_label_unique 
ON public.sizes (LOWER(label));

-- Material name uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_name_unique 
ON public.materials (LOWER(name));

-- 2. Add check constraints for data validation
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS chk_order_amounts;

ALTER TABLE public.orders 
ADD CONSTRAINT chk_order_amounts 
CHECK (
  subtotal >= 0 AND 
  discount_amount >= 0 AND 
  shipping_cost >= 0 AND 
  tax_amount >= 0 AND 
  total_amount >= 0 AND
  paid_amount >= 0
);

ALTER TABLE public.order_items 
DROP CONSTRAINT IF EXISTS chk_order_item_values;

ALTER TABLE public.order_items 
ADD CONSTRAINT chk_order_item_values 
CHECK (
  quantity > 0 AND 
  unit_price >= 0 AND 
  line_total >= 0 AND
  fulfilled_quantity >= 0 AND
  returned_quantity >= 0
);

ALTER TABLE public.product_variants 
DROP CONSTRAINT IF EXISTS chk_variant_prices;

ALTER TABLE public.product_variants 
ADD CONSTRAINT chk_variant_prices 
CHECK (purchase_price >= 0 AND selling_price >= 0);

ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS chk_product_base_price;

ALTER TABLE public.products 
ADD CONSTRAINT chk_product_base_price 
CHECK (base_price >= 0);

ALTER TABLE public.accounts 
DROP CONSTRAINT IF EXISTS chk_account_balance;

ALTER TABLE public.accounts 
ADD CONSTRAINT chk_account_balance 
CHECK (initial_balance >= 0);

ALTER TABLE public.transactions 
DROP CONSTRAINT IF EXISTS chk_transaction_amount;

ALTER TABLE public.transactions 
ADD CONSTRAINT chk_transaction_amount 
CHECK (amount > 0);

ALTER TABLE public.order_payments 
DROP CONSTRAINT IF EXISTS chk_payment_amount;

ALTER TABLE public.order_payments 
ADD CONSTRAINT chk_payment_amount 
CHECK (amount > 0);

-- 3. Ensure updated_at triggers exist on all tables
DO $$
DECLARE
  tbl_name TEXT;
  tables_to_check TEXT[] := ARRAY[
    'accounts', 'brands', 'care_instructions', 'categories', 'colors',
    'customer_accounts', 'customer_risk_profiles', 'customer_types', 
    'customers', 'divisions', 'materials', 'order_items', 'orders',
    'pages', 'payment_methods', 'product_images', 'product_variants',
    'products', 'return_requests', 'seo_metadata', 'size_guides', 
    'sizes', 'thanas', 'transaction_categories', 'transactions',
    'blog_categories', 'blog_posts'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY tables_to_check
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'set_updated_at_' || tbl_name 
      AND tgrelid = ('public.' || tbl_name)::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at_%I 
         BEFORE UPDATE ON public.%I 
         FOR EACH ROW 
         EXECUTE FUNCTION public.update_updated_at_column()',
        tbl_name, tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- 4. Add missing composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_status 
ON public.orders (customer_id, order_status) WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment 
ON public.order_items (order_id, fulfillment_status);

CREATE INDEX IF NOT EXISTS idx_transactions_account_date 
ON public.transactions (account_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type_date 
ON public.transactions (type, date DESC);

CREATE INDEX IF NOT EXISTS idx_customers_type_active 
ON public.customers (customer_type_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON public.products (category_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_order_payments_order_account 
ON public.order_payments (order_id, account_id);

-- 5. Add partial indexes for soft-delete patterns
CREATE INDEX IF NOT EXISTS idx_payment_methods_active_sorted 
ON public.payment_methods (sort_order) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_divisions_active 
ON public.divisions (name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_thanas_active_division 
ON public.thanas (division_id, name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customer_types_active 
ON public.customer_types (name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_accounts_active 
ON public.accounts (name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transaction_categories_active_type 
ON public.transaction_categories (type, name) WHERE is_active = true;