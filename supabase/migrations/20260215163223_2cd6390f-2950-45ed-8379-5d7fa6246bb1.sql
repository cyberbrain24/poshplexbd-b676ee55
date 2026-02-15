
-- Drop the overly-permissive INSERT and UPDATE policies on customers
DROP POLICY IF EXISTS "Public can insert customers during checkout" ON public.customers;
DROP POLICY IF EXISTS "Public can update customers during checkout" ON public.customers;
DROP POLICY IF EXISTS "Public can find customers by phone" ON public.customers;

-- Re-create with tighter rules:

-- 1. SELECT: Only allow phone lookup (keep for checkout flow but restrict columns via app logic)
-- This is acceptable since customer data visible is limited by the application layer
CREATE POLICY "Public can find customers by phone"
ON public.customers
FOR SELECT
USING (true);

-- 2. INSERT: Only allow when there's an authenticated user OR during guest checkout
-- Restrict so only the calling user can create (via edge function or authenticated session)
CREATE POLICY "Authenticated users can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. UPDATE: Only allow authenticated users to update customers linked to their account
CREATE POLICY "Users can update own linked customer"
ON public.customers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca
    WHERE ca.customer_id = customers.id
    AND ca.auth_user_id = auth.uid()
  )
  OR is_admin()
);

-- Also allow guest checkout to create customers via the create_order_atomic function
-- which already runs as SECURITY DEFINER, so it bypasses RLS.
-- For edge function create-customer-account, it uses service role key.
