-- Allow public to read active divisions for checkout
CREATE POLICY "Public can view active divisions" 
ON public.divisions 
FOR SELECT 
USING (is_active = true);

-- Allow public to read active thanas for checkout  
CREATE POLICY "Public can view active thanas"
ON public.thanas
FOR SELECT
USING (is_active = true);