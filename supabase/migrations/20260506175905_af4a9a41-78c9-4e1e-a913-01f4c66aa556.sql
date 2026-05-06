ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_called_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_center_notes TEXT;