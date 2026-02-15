
-- Drop the too-restrictive INSERT policy 
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;

-- Allow insert for authenticated users OR during checkout (where guest_phone pattern is used)
-- The create_customer_account edge function uses service_role so bypasses RLS
CREATE POLICY "Authenticated or checkout can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  OR 
  -- Allow guest checkout to create customer records
  -- The phone field is required and serves as the natural key
  (phone IS NOT NULL AND phone != '')
);

-- Also need to allow guest checkout to UPDATE existing customer details
DROP POLICY IF EXISTS "Users can update own linked customer" ON public.customers;

CREATE POLICY "Linked users or admin can update customers"
ON public.customers
FOR UPDATE
USING (
  is_admin()
  OR
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca
    WHERE ca.customer_id = customers.id
    AND ca.auth_user_id = auth.uid()
  )
  OR
  -- Allow checkout flow to update customer details (guest checkout)
  (auth.uid() IS NULL AND id = id)
);
