-- Fix overly permissive RLS policies on customer_accounts
DROP POLICY IF EXISTS "Admins can manage all accounts" ON public.customer_accounts;

-- Create specific admin policies instead
CREATE POLICY "Admins can insert accounts" ON public.customer_accounts
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update accounts" ON public.customer_accounts
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete accounts" ON public.customer_accounts
  FOR DELETE USING (public.is_admin());