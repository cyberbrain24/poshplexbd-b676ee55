
-- 1. Extend product_type enum with 'combo' (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'product_type' AND e.enumlabel = 'combo'
  ) THEN
    ALTER TYPE public.product_type ADD VALUE 'combo';
  END IF;
END$$;

-- 2. combo_items table
CREATE TABLE IF NOT EXISTS public.combo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  combo_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  child_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT combo_items_unique UNIQUE (combo_product_id, child_product_id),
  CONSTRAINT combo_items_no_self CHECK (combo_product_id <> child_product_id)
);

CREATE INDEX IF NOT EXISTS combo_items_combo_idx ON public.combo_items(combo_product_id);
CREATE INDEX IF NOT EXISTS combo_items_child_idx ON public.combo_items(child_product_id);

GRANT SELECT ON public.combo_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.combo_items TO authenticated;
GRANT ALL ON public.combo_items TO service_role;

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view combo items"
  ON public.combo_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert combo items"
  ON public.combo_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update combo items"
  ON public.combo_items FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete combo items"
  ON public.combo_items FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE TRIGGER update_combo_items_updated_at
  BEFORE UPDATE ON public.combo_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Add parent_combo_order_item_id to order_items for grouping expanded combo lines
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS parent_combo_order_item_id UUID
  REFERENCES public.order_items(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS order_items_parent_combo_idx
  ON public.order_items(parent_combo_order_item_id);
