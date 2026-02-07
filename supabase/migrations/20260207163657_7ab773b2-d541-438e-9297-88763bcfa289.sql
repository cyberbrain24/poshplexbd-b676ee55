-- Create order_payments table to track individual payment entries
CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL CHECK (amount > 0),
  account_id UUID NOT NULL REFERENCES public.accounts(id),
  transaction_id UUID REFERENCES public.transactions(id),
  payment_reference TEXT,
  recorded_by UUID,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add paid_amount column to orders table
ALTER TABLE public.orders ADD COLUMN paid_amount DECIMAL NOT NULL DEFAULT 0;

-- Enable RLS on order_payments
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_payments (admin only)
CREATE POLICY "Admins can view order_payments"
ON public.order_payments FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can insert order_payments"
ON public.order_payments FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update order_payments"
ON public.order_payments FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete order_payments"
ON public.order_payments FOR DELETE
USING (is_admin());

-- Create index for faster lookups
CREATE INDEX idx_order_payments_order_id ON public.order_payments(order_id);
CREATE INDEX idx_order_payments_account_id ON public.order_payments(account_id);