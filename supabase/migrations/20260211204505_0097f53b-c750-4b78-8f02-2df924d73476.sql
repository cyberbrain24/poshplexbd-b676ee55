
-- Add public visibility settings to customer_types (membership types)
ALTER TABLE public.customer_types ADD COLUMN IF NOT EXISTS show_on_public_page boolean NOT NULL DEFAULT false;
ALTER TABLE public.customer_types ADD COLUMN IF NOT EXISTS show_member_since boolean NOT NULL DEFAULT true;

-- Add public profile visibility and membership assignment date to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS public_profile_visible boolean NOT NULL DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS membership_assigned_at timestamp with time zone;

-- Allow public to read customer_types that are marked public
CREATE POLICY "Public can view public customer_types"
ON public.customer_types FOR SELECT
USING (show_on_public_page = true);

-- Allow public to view customers with public profiles and public membership types
CREATE POLICY "Public can view public member profiles"
ON public.customers FOR SELECT
USING (
  public_profile_visible = true
  AND is_active = true
  AND customer_type_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.customer_types ct
    WHERE ct.id = customers.customer_type_id
    AND ct.show_on_public_page = true
    AND ct.is_active = true
  )
);

-- Index for efficient public membership queries
CREATE INDEX IF NOT EXISTS idx_customers_public_membership
ON public.customers (customer_type_id, public_profile_visible, is_active)
WHERE public_profile_visible = true AND is_active = true AND customer_type_id IS NOT NULL;
