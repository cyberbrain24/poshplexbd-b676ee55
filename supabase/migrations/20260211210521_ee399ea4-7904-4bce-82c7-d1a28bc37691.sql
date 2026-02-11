
-- ============================================================
-- 1. SAFE PERFORMANCE INDEXES (additive, non-breaking)
-- ============================================================

-- Orders: frequently filtered by status, payment_status, created_at
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Order items: frequently joined on order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- Products: filtered by category, active status, search
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

-- Product images: joined on product_id, sorted by sort_order
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images (product_id);

-- Product variants: joined on product_id
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants (product_id);

-- Customers: searched by phone, filtered by type
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type_id ON public.customers (customer_type_id);

-- Promo code usages: checked per customer per promo
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_promo_customer ON public.promo_code_usages (promo_code_id, customer_id);

-- Order payments: queried by order_id
CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON public.order_payments (order_id);

-- Order status history: queried by order_id
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history (order_id);

-- Transactions: filtered by account, date
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);

-- Thanas: filtered by division_id
CREATE INDEX IF NOT EXISTS idx_thanas_division_id ON public.thanas (division_id);

-- ============================================================
-- 2. PAYMENT IDEMPOTENCY COLUMN (nullable, backward compatible)
-- ============================================================
ALTER TABLE public.order_payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- ============================================================
-- 3. ATOMIC ORDER CREATION RPC (optional, fallback to sequential)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
BEGIN
  -- Insert order
  INSERT INTO public.orders (
    order_number,
    customer_id, guest_email, guest_phone,
    order_status, payment_status,
    payment_method_id, payment_method_type,
    transaction_id, sender_number, payment_proof_url,
    subtotal, discount_amount, shipping_cost, tax_amount, total_amount, paid_amount,
    shipping_name, shipping_phone, shipping_email,
    shipping_address, shipping_city, shipping_division_id, shipping_thana_id, shipping_postal_code,
    customer_notes, risk_level, risk_flags,
    promo_code, promo_code_id, promo_discount
  )
  VALUES (
    '', -- Will be overwritten by trigger
    (p_order->>'customer_id')::UUID,
    p_order->>'guest_email',
    p_order->>'guest_phone',
    COALESCE(p_order->>'order_status', 'pending')::order_status,
    COALESCE(p_order->>'payment_status', 'unpaid')::payment_status,
    (p_order->>'payment_method_id')::UUID,
    (p_order->>'payment_method_type')::payment_method_type,
    p_order->>'transaction_id',
    p_order->>'sender_number',
    p_order->>'payment_proof_url',
    COALESCE((p_order->>'subtotal')::NUMERIC, 0),
    COALESCE((p_order->>'discount_amount')::NUMERIC, 0),
    COALESCE((p_order->>'shipping_cost')::NUMERIC, 0),
    COALESCE((p_order->>'tax_amount')::NUMERIC, 0),
    COALESCE((p_order->>'total_amount')::NUMERIC, 0),
    COALESCE((p_order->>'paid_amount')::NUMERIC, 0),
    p_order->>'shipping_name',
    p_order->>'shipping_phone',
    p_order->>'shipping_email',
    p_order->>'shipping_address',
    p_order->>'shipping_city',
    (p_order->>'shipping_division_id')::UUID,
    (p_order->>'shipping_thana_id')::UUID,
    p_order->>'shipping_postal_code',
    p_order->>'customer_notes',
    COALESCE(p_order->>'risk_level', 'low')::risk_level,
    COALESCE(p_order->'risk_flags', '[]'::JSONB),
    p_order->>'promo_code',
    (p_order->>'promo_code_id')::UUID,
    COALESCE((p_order->>'promo_discount')::NUMERIC, 0)
  )
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- Insert all order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id,
      product_name, variant_sku, variant_details,
      unit_price, quantity, line_total, fulfillment_status
    )
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'variant_id')::UUID,
      v_item->>'product_name',
      v_item->>'variant_sku',
      COALESCE(v_item->'variant_details', '{}'::JSONB),
      (v_item->>'unit_price')::NUMERIC,
      COALESCE((v_item->>'quantity')::INT, 1),
      (v_item->>'line_total')::NUMERIC,
      'pending'::item_fulfillment_status
    );
  END LOOP;

  -- Insert initial status history
  INSERT INTO public.order_status_history (
    order_id, new_status, status_type, notes
  )
  VALUES (
    v_order_id, 'pending', 'order', 'Order placed'
  );

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number
  );
END;
$$;

-- ============================================================
-- 4. ATOMIC PROMO USAGE INCREMENT RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_promo_code_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.promo_codes
  SET usage_count = usage_count + 1
  WHERE id = p_promo_code_id;
$$;
