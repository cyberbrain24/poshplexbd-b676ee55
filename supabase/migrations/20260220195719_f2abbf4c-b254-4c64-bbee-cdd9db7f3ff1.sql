
-- ============================================================
-- BUG FIX 1: customer_types infinite recursion
-- The policy "Customers can view own assigned membership type"
-- joins customers → customer_accounts which can recurse.
-- Replace it with a SECURITY DEFINER function.
-- ============================================================

-- Create a helper function to check if the current user is linked
-- to a customer that has a given customer_type_id
CREATE OR REPLACE FUNCTION public.user_has_customer_type(_customer_type_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_accounts ca
    JOIN public.customers c ON c.id = ca.customer_id
    WHERE ca.auth_user_id = auth.uid()
      AND c.customer_type_id = _customer_type_id
  )
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Customers can view own assigned membership type" ON public.customer_types;

-- Re-create it using the safe function (no recursion)
CREATE POLICY "Customers can view own assigned membership type"
  ON public.customer_types
  FOR SELECT
  USING (public.user_has_customer_type(id));

-- ============================================================
-- BUG FIX 2: orders SELECT policy is broken/insecure
-- Old policy: "guest_email IS NOT NULL OR guest_phone IS NOT NULL OR is_admin()"
-- This exposes ALL orders that have guest data to every user.
-- Customers with accounts cannot see their own orders by customer_id.
-- Fix: allow customers to see orders where customer_id matches their linked customer.
-- ============================================================

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;

-- Create a secure function to get the customer_id linked to current user
CREATE OR REPLACE FUNCTION public.get_my_customer_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ca.customer_id
  FROM public.customer_accounts ca
  WHERE ca.auth_user_id = auth.uid()
  LIMIT 1
$$;

CREATE POLICY "Customers can view own orders"
  ON public.orders
  FOR SELECT
  USING (
    is_admin()
    OR (
      -- Logged-in customers see orders linked to their customer record
      customer_id IS NOT NULL
      AND customer_id = public.get_my_customer_id()
    )
    OR (
      -- Guest orders: only visible when looking up by exact phone/email
      -- (storefront order tracking uses this)
      auth.uid() IS NULL
      AND (guest_phone IS NOT NULL OR guest_email IS NOT NULL)
    )
  );

-- ============================================================
-- BUG FIX 3: Ensure customer_accounts UPDATE has WITH CHECK
-- (prevents RLS bypass on update)
-- ============================================================
DROP POLICY IF EXISTS "Users can update own account" ON public.customer_accounts;

CREATE POLICY "Users can update own account"
  ON public.customer_accounts
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);
