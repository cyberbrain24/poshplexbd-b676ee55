-- Create customer_accounts table to link Supabase auth users with customer records
CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  phone text UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own account
CREATE POLICY "Users can view own account" ON public.customer_accounts
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own account" ON public.customer_accounts
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all accounts" ON public.customer_accounts
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can manage all accounts" ON public.customer_accounts
  FOR ALL USING (public.is_admin());

-- Allow insert during signup (auth user creates their own record)
CREATE POLICY "Users can create own account" ON public.customer_accounts
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Trigger for updated_at
CREATE TRIGGER update_customer_accounts_updated_at
  BEFORE UPDATE ON public.customer_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();