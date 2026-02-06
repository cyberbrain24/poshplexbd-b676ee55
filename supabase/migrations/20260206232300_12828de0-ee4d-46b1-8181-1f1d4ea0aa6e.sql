-- Create enums for order and payment statuses
CREATE TYPE public.order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 
  'partially_delivered', 'returned', 'cancelled', 'failed', 'rto'
);

CREATE TYPE public.payment_status AS ENUM (
  'unpaid', 'pending_verification', 'paid', 'partially_paid', 
  'partially_refunded', 'refunded', 'failed'
);

CREATE TYPE public.payment_method_type AS ENUM (
  'cod', 'mobile_banking', 'bank_transfer', 'card', 'online_gateway'
);

CREATE TYPE public.item_fulfillment_status AS ENUM (
  'pending', 'reserved', 'shipped', 'delivered', 'out_of_stock', 
  'returned', 'return_pending', 'damaged', 'cancelled'
);

CREATE TYPE public.inventory_transaction_type AS ENUM (
  'reserve', 'deduct', 'restock', 'return_good', 'return_damaged', 
  'adjustment', 'initial'
);

CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high');

-- Payment methods configuration table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type payment_method_type NOT NULL,
  instructions TEXT,
  account_details JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Main orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Status tracking
  order_status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  
  -- Payment details
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_method_type payment_method_type,
  transaction_id TEXT,
  sender_number TEXT,
  payment_proof_url TEXT,
  payment_verified_at TIMESTAMPTZ,
  payment_verified_by UUID,
  
  -- Pricing (locked at checkout)
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  
  -- Shipping details
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT,
  shipping_division_id UUID REFERENCES public.divisions(id),
  shipping_thana_id UUID REFERENCES public.thanas(id),
  shipping_postal_code TEXT,
  
  -- Tracking
  tracking_number TEXT,
  courier_name TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Risk assessment
  risk_level risk_level DEFAULT 'low',
  risk_flags JSONB DEFAULT '[]',
  ip_address TEXT,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items with item-level tracking
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot at purchase time
  product_name TEXT NOT NULL,
  variant_sku TEXT,
  variant_details JSONB DEFAULT '{}',
  unit_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC NOT NULL,
  
  -- Item-level fulfillment
  fulfillment_status item_fulfillment_status NOT NULL DEFAULT 'pending',
  fulfilled_quantity INTEGER NOT NULL DEFAULT 0,
  returned_quantity INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order status history / audit trail
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  
  previous_status TEXT,
  new_status TEXT NOT NULL,
  status_type TEXT NOT NULL, -- 'order', 'payment', 'fulfillment'
  
  changed_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory transactions for atomic stock management
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  
  transaction_type inventory_transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  
  -- Stock levels after transaction
  available_stock_after INTEGER NOT NULL,
  reserved_stock_after INTEGER NOT NULL,
  
  notes TEXT,
  performed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add stock columns to product_variants
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS available_stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0;

-- Customer risk profile
CREATE TABLE public.customer_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  
  total_orders INTEGER NOT NULL DEFAULT 0,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  cancelled_orders INTEGER NOT NULL DEFAULT 0,
  returned_orders INTEGER NOT NULL DEFAULT 0,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  
  cancellation_rate NUMERIC NOT NULL DEFAULT 0,
  return_rate NUMERIC NOT NULL DEFAULT 0,
  
  cod_disabled BOOLEAN NOT NULL DEFAULT false,
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  blacklist_reason TEXT,
  
  last_order_at TIMESTAMPTZ,
  active_cod_orders INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Return requests
CREATE TABLE public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  description TEXT,
  proof_images JSONB DEFAULT '[]',
  
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, received, restocked, damaged
  
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  
  -- Inventory decision
  restock_decision TEXT, -- 'restock', 'damaged', 'pending'
  restocked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_orders_number ON public.orders(order_number);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);
CREATE INDEX idx_order_items_variant ON public.order_items(variant_id);
CREATE INDEX idx_inventory_tx_variant ON public.inventory_transactions(variant_id);
CREATE INDEX idx_inventory_tx_order ON public.inventory_transactions(order_id);
CREATE INDEX idx_order_history_order ON public.order_status_history(order_id);
CREATE INDEX idx_return_requests_order ON public.return_requests(order_id);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods (public read, admin write)
CREATE POLICY "Public can view active payment_methods" ON public.payment_methods 
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert payment_methods" ON public.payment_methods 
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update payment_methods" ON public.payment_methods 
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete payment_methods" ON public.payment_methods 
  FOR DELETE USING (is_admin());

-- RLS Policies for orders (public insert for checkout, admin full access)
CREATE POLICY "Public can create orders" ON public.orders 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can view own orders" ON public.orders 
  FOR SELECT USING (
    guest_email IS NOT NULL OR 
    guest_phone IS NOT NULL OR 
    is_admin()
  );

CREATE POLICY "Admins can update orders" ON public.orders 
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete orders" ON public.orders 
  FOR DELETE USING (is_admin());

-- RLS Policies for order_items
CREATE POLICY "Public can create order_items" ON public.order_items 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view order_items" ON public.order_items 
  FOR SELECT USING (true);

CREATE POLICY "Admins can update order_items" ON public.order_items 
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete order_items" ON public.order_items 
  FOR DELETE USING (is_admin());

-- RLS Policies for order_status_history
CREATE POLICY "Public can view order_status_history" ON public.order_status_history 
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert order_status_history" ON public.order_status_history 
  FOR INSERT WITH CHECK (is_admin());

-- RLS Policies for inventory_transactions (admin only)
CREATE POLICY "Admins can view inventory_transactions" ON public.inventory_transactions 
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert inventory_transactions" ON public.inventory_transactions 
  FOR INSERT WITH CHECK (is_admin());

-- RLS Policies for customer_risk_profiles (admin only)
CREATE POLICY "Admins can view customer_risk_profiles" ON public.customer_risk_profiles 
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can insert customer_risk_profiles" ON public.customer_risk_profiles 
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update customer_risk_profiles" ON public.customer_risk_profiles 
  FOR UPDATE USING (is_admin());

-- RLS Policies for return_requests
CREATE POLICY "Public can create return_requests" ON public.return_requests 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view return_requests" ON public.return_requests 
  FOR SELECT USING (true);

CREATE POLICY "Admins can update return_requests" ON public.return_requests 
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete return_requests" ON public.return_requests 
  FOR DELETE USING (is_admin());

-- Function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION public.generate_order_number();

-- Function to update order status based on item statuses
CREATE OR REPLACE FUNCTION public.update_order_status_from_items()
RETURNS TRIGGER AS $$
DECLARE
  total_items INTEGER;
  delivered_items INTEGER;
  shipped_items INTEGER;
  cancelled_items INTEGER;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE fulfillment_status = 'delivered'),
    COUNT(*) FILTER (WHERE fulfillment_status = 'shipped'),
    COUNT(*) FILTER (WHERE fulfillment_status IN ('cancelled', 'out_of_stock'))
  INTO total_items, delivered_items, shipped_items, cancelled_items
  FROM public.order_items
  WHERE order_id = NEW.order_id;

  IF delivered_items = total_items THEN
    UPDATE public.orders SET order_status = 'delivered', delivered_at = NOW() WHERE id = NEW.order_id;
  ELSIF delivered_items > 0 THEN
    UPDATE public.orders SET order_status = 'partially_delivered' WHERE id = NEW.order_id;
  ELSIF shipped_items > 0 THEN
    UPDATE public.orders SET order_status = 'shipped' WHERE id = NEW.order_id;
  ELSIF cancelled_items = total_items THEN
    UPDATE public.orders SET order_status = 'cancelled' WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_order_status_trigger
  AFTER UPDATE ON public.order_items
  FOR EACH ROW
  WHEN (OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status)
  EXECUTE FUNCTION public.update_order_status_from_items();

-- Function to update customer risk profile
CREATE OR REPLACE FUNCTION public.update_customer_risk_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_risk_profiles (customer_id, total_orders, last_order_at)
  VALUES (NEW.customer_id, 1, NOW())
  ON CONFLICT (customer_id) DO UPDATE SET
    total_orders = customer_risk_profiles.total_orders + 1,
    last_order_at = NOW(),
    active_cod_orders = CASE 
      WHEN NEW.payment_method_type = 'cod' AND NEW.order_status = 'pending'
      THEN customer_risk_profiles.active_cod_orders + 1 
      ELSE customer_risk_profiles.active_cod_orders 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_risk_profile_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.customer_id IS NOT NULL)
  EXECUTE FUNCTION public.update_customer_risk_profile();

-- Updated_at triggers
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_risk_profiles_updated_at BEFORE UPDATE ON public.customer_risk_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_return_requests_updated_at BEFORE UPDATE ON public.return_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, instructions, account_details, sort_order) VALUES
('Cash on Delivery', 'cod', 'Pay when your order is delivered to your doorstep.', '{}', 1),
('bKash', 'mobile_banking', 'Send payment to our bKash number and enter your transaction ID.', '{"number": "01XXXXXXXXX", "type": "Personal"}', 2),
('Nagad', 'mobile_banking', 'Send payment to our Nagad number and enter your transaction ID.', '{"number": "01XXXXXXXXX", "type": "Personal"}', 3),
('Bank Transfer', 'bank_transfer', 'Transfer to our bank account and provide transaction details.', '{"bank": "Bank Name", "account": "XXXXXXXXXXXX", "branch": "Branch Name"}', 4);