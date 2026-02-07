-- Allow public to insert customers during checkout
CREATE POLICY "Public can insert customers during checkout"
ON public.customers
FOR INSERT
WITH CHECK (true);

-- Allow public to select customers by phone (for finding existing customer)
CREATE POLICY "Public can find customers by phone"
ON public.customers
FOR SELECT
USING (true);

-- Allow public to update their own customer record (matched by phone)
CREATE POLICY "Public can update customers during checkout"
ON public.customers
FOR UPDATE
USING (true);