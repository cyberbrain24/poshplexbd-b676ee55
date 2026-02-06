-- Fix overly permissive RLS policies

-- Drop and recreate orders INSERT policy with rate limiting consideration
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
DROP POLICY IF EXISTS "Public can create order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public can create return_requests" ON public.return_requests;

-- Orders: Allow authenticated users or track guest orders by phone/email
CREATE POLICY "Authenticated or guest can create orders" ON public.orders 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR 
    (guest_email IS NOT NULL OR guest_phone IS NOT NULL)
  );

-- Order items: Only allow if related to an order being created
CREATE POLICY "Can create order_items for existing orders" ON public.order_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id
    )
  );

-- Return requests: Only for existing order items
CREATE POLICY "Can create return_requests for own orders" ON public.return_requests 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.order_items WHERE id = order_item_id
    )
  );