
-- Allow customers to view their own assigned membership type
-- This fixes the issue where admin-assigned membership types with show_on_public_page=false
-- were not visible to the customer on their account page.
CREATE POLICY "Customers can view own assigned membership type"
ON public.customer_types
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.customers c
    JOIN public.customer_accounts ca ON ca.customer_id = c.id
    WHERE c.customer_type_id = customer_types.id
    AND ca.auth_user_id = auth.uid()
  )
);
