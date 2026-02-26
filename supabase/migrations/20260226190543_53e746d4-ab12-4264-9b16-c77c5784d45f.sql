
-- Add subcategory_id and transaction_id to inventory_entries
ALTER TABLE public.inventory_entries 
  ADD COLUMN IF NOT EXISTS subcategory_id uuid REFERENCES public.transaction_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL;
