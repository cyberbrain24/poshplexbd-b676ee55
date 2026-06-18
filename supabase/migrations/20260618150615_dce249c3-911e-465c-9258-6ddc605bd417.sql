ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_source text NOT NULL DEFAULT 'storefront';

CREATE INDEX IF NOT EXISTS idx_orders_created_by_user_id ON public.orders(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by_source ON public.orders(created_by_source);