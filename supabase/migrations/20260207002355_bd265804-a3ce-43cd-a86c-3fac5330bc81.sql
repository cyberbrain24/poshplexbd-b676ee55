-- ============================================================
-- Poshplex ERP Performance Indexes
-- B-Tree indexes on frequently searched/filtered columns
-- ============================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders USING btree (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_phone ON public.orders USING btree (shipping_phone);
CREATE INDEX IF NOT EXISTS idx_orders_verification_queue ON public.orders USING btree (payment_status, created_at) WHERE payment_status = 'pending_verification';

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items USING btree (variant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_fulfillment ON public.order_items USING btree (fulfillment_status);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products USING btree (sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING btree (name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products USING btree (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products USING btree (created_at DESC);

-- Product variants indexes (critical for inventory lookups)
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants USING btree (sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants USING btree (stock);
CREATE INDEX IF NOT EXISTS idx_product_variants_low_stock ON public.product_variants USING btree (stock, is_active) WHERE stock < 10 AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_variants_color_id ON public.product_variants USING btree (color_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_size_id ON public.product_variants USING btree (size_id);

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_main ON public.product_images USING btree (product_id, is_main) WHERE is_main = true;

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers USING btree (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers USING btree (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers USING btree (name);
CREATE INDEX IF NOT EXISTS idx_customers_division_id ON public.customers USING btree (division_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers USING btree (is_active) WHERE is_active = true;

-- Inventory transactions indexes (for audit trail)
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_variant_id ON public.inventory_transactions USING btree (variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON public.inventory_transactions USING btree (transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_order_id ON public.inventory_transactions USING btree (order_id) WHERE order_id IS NOT NULL;

-- Order status history indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history USING btree (created_at DESC);

-- Blog posts indexes (for SEO/discovery)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts USING btree (status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts USING btree (published_at DESC) WHERE status = 'published';

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories USING btree (parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories USING btree (name);

-- Payment methods index
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods USING btree (is_active, sort_order) WHERE is_active = true;