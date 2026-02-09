-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, product_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Customers can view their own reviews (including unapproved)
CREATE POLICY "Customers can view own reviews"
ON public.reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca 
    WHERE ca.customer_id = reviews.customer_id 
    AND ca.auth_user_id = auth.uid()
  )
);

-- Customers can create reviews for products they purchased
CREATE POLICY "Customers can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca 
    WHERE ca.customer_id = reviews.customer_id 
    AND ca.auth_user_id = auth.uid()
  )
);

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca 
    WHERE ca.customer_id = reviews.customer_id 
    AND ca.auth_user_id = auth.uid()
  )
);

-- Customers can delete their own reviews
CREATE POLICY "Customers can delete own reviews"
ON public.reviews
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.customer_accounts ca 
    WHERE ca.customer_id = reviews.customer_id 
    AND ca.auth_user_id = auth.uid()
  )
);

-- Admins have full access
CREATE POLICY "Admins can manage reviews"
ON public.reviews
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Add updated_at trigger
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);