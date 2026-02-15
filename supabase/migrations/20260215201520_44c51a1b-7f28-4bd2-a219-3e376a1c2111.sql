
-- ============================================================
-- PHASE 1A: Remove duplicate indexes (free up write overhead)
-- ============================================================

-- orders: duplicate created_at DESC indexes
DROP INDEX IF EXISTS idx_orders_created;
-- keep idx_orders_created_at

-- orders: duplicate order_status indexes
DROP INDEX IF EXISTS idx_orders_status;
-- keep idx_orders_order_status

-- orders: duplicate order_number indexes
DROP INDEX IF EXISTS idx_orders_number;
-- keep idx_orders_order_number (and unique constraint)

-- orders: duplicate customer_id indexes
DROP INDEX IF EXISTS idx_orders_customer;
-- keep idx_orders_customer_id

-- order_items: duplicate order_id indexes
DROP INDEX IF EXISTS idx_order_items_order;
-- keep idx_order_items_order_id

-- order_items: duplicate product_id indexes
DROP INDEX IF EXISTS idx_order_items_product;
-- keep idx_order_items_product_id

-- order_items: duplicate variant_id indexes
DROP INDEX IF EXISTS idx_order_items_variant;
-- keep idx_order_items_variant_id

-- order_status_history: duplicate order_id indexes
DROP INDEX IF EXISTS idx_order_history_order;
-- keep idx_order_status_history_order_id

-- products: redundant is_active partial index (idx_products_active covers id WHERE is_active)
DROP INDEX IF EXISTS idx_products_is_active;
-- keep idx_products_active

-- ============================================================
-- PHASE 1B: Add missing indexes for query patterns
-- ============================================================

-- products: brand_id for filtered queries
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products USING btree (brand_id);

-- products: composite for storefront listing (category + active + newest)
CREATE INDEX IF NOT EXISTS idx_products_storefront_listing ON public.products USING btree (is_active, category_id, created_at DESC)
  WHERE (is_active = true);

-- products: composite for admin search (name + sku trigram-like via btree)
CREATE INDEX IF NOT EXISTS idx_products_name_lower ON public.products USING btree (lower(name));

-- product_variants: composite for product detail lookup
CREATE INDEX IF NOT EXISTS idx_product_variants_product_active ON public.product_variants USING btree (product_id, is_active);

-- product_variants: material_id for variant filtering
CREATE INDEX IF NOT EXISTS idx_product_variants_material_id ON public.product_variants USING btree (material_id);

-- product_images: composite for sorted image fetching per product
CREATE INDEX IF NOT EXISTS idx_product_images_product_sort ON public.product_images USING btree (product_id, sort_order);

-- product_images: color_id for color-filtered gallery
CREATE INDEX IF NOT EXISTS idx_product_images_color_id ON public.product_images USING btree (color_id);

-- customer_addresses: customer_id for address lookups
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON public.customer_addresses USING btree (customer_id);

-- return_requests: composite for status-based queue
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests USING btree (status, created_at DESC);

-- return_requests: customer lookup
CREATE INDEX IF NOT EXISTS idx_return_requests_customer_id ON public.return_requests USING btree (customer_id);

-- return_requests: order_item lookup
CREATE INDEX IF NOT EXISTS idx_return_requests_order_item_id ON public.return_requests USING btree (order_item_id);

-- reviews: composite for approved product reviews (storefront)
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON public.reviews USING btree (product_id, created_at DESC)
  WHERE (is_approved = true);

-- orders: composite for search by shipping_name
CREATE INDEX IF NOT EXISTS idx_orders_shipping_name ON public.orders USING btree (lower(shipping_name));

-- orders: composite for date range + status queries (admin analytics)
CREATE INDEX IF NOT EXISTS idx_orders_date_payment ON public.orders USING btree (created_at DESC, payment_status);
