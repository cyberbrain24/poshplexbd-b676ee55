-- Fix seed_jobs RLS policies: restrict INSERT/UPDATE to admins only
-- Keep public SELECT for progress monitoring

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can view seed jobs" ON public.seed_jobs;
DROP POLICY IF EXISTS "Anyone can insert seed jobs" ON public.seed_jobs;
DROP POLICY IF EXISTS "Anyone can update seed jobs" ON public.seed_jobs;

-- Create admin-only policies for mutations
CREATE POLICY "Admins can insert seed jobs" 
  ON public.seed_jobs 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update seed jobs" 
  ON public.seed_jobs 
  FOR UPDATE 
  USING (is_admin());

-- Keep public SELECT for monitoring progress
CREATE POLICY "Public can view seed job status" 
  ON public.seed_jobs 
  FOR SELECT 
  USING (true);