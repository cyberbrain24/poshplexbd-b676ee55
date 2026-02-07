-- Add collected_amount and amount_approved_at for COD reconciliation
ALTER TABLE public.orders 
ADD COLUMN collected_amount numeric DEFAULT NULL,
ADD COLUMN amount_approved_at timestamp with time zone DEFAULT NULL,
ADD COLUMN amount_approved_by uuid DEFAULT NULL;