-- Drop the restrictive policy that causes the chicken-and-egg problem
DROP POLICY IF EXISTS "Admins can view user_roles" ON public.user_roles;

-- Create a policy that allows users to check their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles (using security definer function)
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

-- Admins can manage roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update user_roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());