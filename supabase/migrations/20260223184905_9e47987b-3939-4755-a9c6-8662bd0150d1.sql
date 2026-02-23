
ALTER TABLE public.categories ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

-- Set initial sort_order based on created_at
WITH ranked AS (
  SELECT id, parent_id, ROW_NUMBER() OVER (PARTITION BY COALESCE(parent_id, '00000000-0000-0000-0000-000000000000') ORDER BY created_at) as rn
  FROM public.categories
)
UPDATE public.categories c SET sort_order = r.rn FROM ranked r WHERE c.id = r.id;
