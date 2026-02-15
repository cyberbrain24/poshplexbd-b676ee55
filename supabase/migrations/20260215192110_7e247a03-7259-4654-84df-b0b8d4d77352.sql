
-- Add material_id and size_id columns to product_images for dynamic variation-based image assignment
ALTER TABLE public.product_images 
  ADD COLUMN material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  ADD COLUMN size_id uuid REFERENCES public.sizes(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_product_images_material_id ON public.product_images(material_id);
CREATE INDEX idx_product_images_size_id ON public.product_images(size_id);
