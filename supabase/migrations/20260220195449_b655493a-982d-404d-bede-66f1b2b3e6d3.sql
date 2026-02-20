
-- Fix 1: Add WITH CHECK to customers UPDATE policy so linked customers can save their profile
DROP POLICY IF EXISTS "Linked users or admin can update customers" ON public.customers;
CREATE POLICY "Linked users or admin can update customers"
  ON public.customers
  FOR UPDATE
  USING (
    is_admin() OR (
      EXISTS (
        SELECT 1 FROM public.customer_accounts ca
        WHERE ca.customer_id = customers.id AND ca.auth_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    is_admin() OR (
      EXISTS (
        SELECT 1 FROM public.customer_accounts ca
        WHERE ca.customer_id = customers.id AND ca.auth_user_id = auth.uid()
      )
    )
  );

-- Fix 2: Allow linked customers to SELECT their own customer record (even if not public)
-- The existing "Public can find customers by phone" allows all, so SELECT is fine.
-- But let's add an explicit policy for the logged-in customer to read their own data
-- (belt-and-suspenders in case the public policy is restricted in future)
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record"
  ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_accounts ca
      WHERE ca.customer_id = customers.id AND ca.auth_user_id = auth.uid()
    )
  );

-- Fix 3: Fix customer_accounts UPDATE policy — currently only matches auth_user_id
-- The code was trying to update by customer_id which would fail silently
-- The existing "Users can update own account" uses auth_user_id = auth.uid() which is correct
-- No change needed there — we'll fix the code instead.
