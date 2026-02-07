-- ============================================================
-- SAFE DATABASE REFACTORING - Indexes and Constraints
-- No breaking changes - backwards compatible
-- ============================================================

-- 1. Add indexes for frequent query patterns (orders)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 2. Add indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

-- 3. Add indexes for products
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- 4. Add indexes for product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON public.product_variants(is_active);

-- 5. Add indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_division_id ON public.customers(division_id);
CREATE INDEX IF NOT EXISTS idx_customers_thana_id ON public.customers(thana_id);

-- 6. Add indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- 7. Add indexes for order_payments
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_transaction_id ON public.order_payments(transaction_id);

-- 8. Add indexes for order_status_history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at DESC);

-- 9. Add indexes for product_images
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- 10. Add indexes for thanas
CREATE INDEX IF NOT EXISTS idx_thanas_division_id ON public.thanas(division_id);

-- 11. Add indexes for promo_usages
CREATE INDEX IF NOT EXISTS idx_promo_usages_customer_id ON public.promo_usages(customer_id);

-- 12. Add indexes for customer_accounts
CREATE INDEX IF NOT EXISTS idx_customer_accounts_customer_id ON public.customer_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_accounts_auth_user_id ON public.customer_accounts(auth_user_id);

-- 13. Add composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON public.orders(order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_status ON public.orders(created_at DESC, order_status);

-- 14. Add partial indexes for active records (very efficient for filtered queries)
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_divisions_active ON public.divisions(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_thanas_active ON public.thanas(id) WHERE is_active = true;