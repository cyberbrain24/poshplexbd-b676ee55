-- Create enum for product types
CREATE TYPE public.product_type AS ENUM ('simple', 'variable');

-- Colors Master Table
CREATE TABLE public.colors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    hex_code TEXT NOT NULL DEFAULT '#000000',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sizes Master Table
CREATE TABLE public.sizes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    fit_type TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Materials Master Table
CREATE TABLE public.materials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    gsm TEXT,
    season TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Size Guides Master Table
CREATE TABLE public.size_guides (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Care Instructions Master Table
CREATE TABLE public.care_instructions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Categories Table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Brands/Collections Table
CREATE TABLE public.brands (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Products Table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    product_type public.product_type NOT NULL DEFAULT 'simple',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    short_description TEXT,
    full_description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    youtube_url TEXT,
    youtube_autoplay BOOLEAN NOT NULL DEFAULT false,
    youtube_mute BOOLEAN NOT NULL DEFAULT true,
    size_guide_id UUID REFERENCES public.size_guides(id) ON DELETE SET NULL,
    care_instruction_id UUID REFERENCES public.care_instructions(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Images Table
CREATE TABLE public.product_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_main BOOLEAN NOT NULL DEFAULT false,
    color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Variants Table
CREATE TABLE public.product_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES public.colors(id) ON DELETE SET NULL,
    size_id UUID REFERENCES public.sizes(id) ON DELETE SET NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.size_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (products are publicly viewable)
CREATE POLICY "Anyone can view colors" ON public.colors FOR SELECT USING (true);
CREATE POLICY "Anyone can view sizes" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Anyone can view materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Anyone can view size_guides" ON public.size_guides FOR SELECT USING (true);
CREATE POLICY "Anyone can view care_instructions" ON public.care_instructions FOR SELECT USING (true);
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can view product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Anyone can view product_variants" ON public.product_variants FOR SELECT USING (true);

-- ADMIN WRITE policies (authenticated users can manage - we'll add proper role-based access later)
CREATE POLICY "Authenticated users can insert colors" ON public.colors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update colors" ON public.colors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete colors" ON public.colors FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sizes" ON public.sizes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sizes" ON public.sizes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sizes" ON public.sizes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update materials" ON public.materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete materials" ON public.materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert size_guides" ON public.size_guides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update size_guides" ON public.size_guides FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete size_guides" ON public.size_guides FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert care_instructions" ON public.care_instructions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update care_instructions" ON public.care_instructions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete care_instructions" ON public.care_instructions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update categories" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete categories" ON public.categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update brands" ON public.brands FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete brands" ON public.brands FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products" ON public.products FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert product_images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_images" ON public.product_images FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete product_images" ON public.product_images FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert product_variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update product_variants" ON public.product_variants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete product_variants" ON public.product_variants FOR DELETE TO authenticated USING (true);

-- Create function to auto-generate SKU
CREATE OR REPLACE FUNCTION public.generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'SKU-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating product SKU
CREATE TRIGGER trigger_generate_product_sku
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_sku();

-- Create trigger for auto-generating variant SKU
CREATE TRIGGER trigger_generate_variant_sku
BEFORE INSERT ON public.product_variants
FOR EACH ROW
EXECUTE FUNCTION public.generate_sku();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers for all tables
CREATE TRIGGER update_colors_updated_at BEFORE UPDATE ON public.colors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sizes_updated_at BEFORE UPDATE ON public.sizes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_size_guides_updated_at BEFORE UPDATE ON public.size_guides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_instructions_updated_at BEFORE UPDATE ON public.care_instructions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for product images bucket
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can update product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Insert default data for master tables
INSERT INTO public.colors (name, hex_code) VALUES 
  ('Black', '#000000'),
  ('White', '#FFFFFF'),
  ('Gold', '#FFD700'),
  ('Silver', '#C0C0C0'),
  ('Rose Gold', '#B76E79');

INSERT INTO public.sizes (label, fit_type, sort_order) VALUES 
  ('XS', 'Regular', 1),
  ('S', 'Regular', 2),
  ('M', 'Regular', 3),
  ('L', 'Regular', 4),
  ('XL', 'Regular', 5);

INSERT INTO public.materials (name, gsm, season) VALUES 
  ('Sterling Silver', NULL, 'All Season'),
  ('18k Gold Plated', NULL, 'All Season'),
  ('Brass', NULL, 'All Season');

INSERT INTO public.size_guides (name, content) VALUES 
  ('Earrings Size Guide', 'Small (S): 1.8cm x 0.9cm\nMedium (M): 2.5cm x 1.2cm\nLarge (L): 3.2cm x 1.5cm'),
  ('Rings Size Guide', 'US 5: 15.7mm\nUS 6: 16.5mm\nUS 7: 17.3mm\nUS 8: 18.1mm');

INSERT INTO public.care_instructions (name, content) VALUES 
  ('Jewelry Care', '• Clean with a soft, dry cloth after each wear\n• Avoid contact with perfumes, lotions, and cleaning products\n• Store in the provided jewelry pouch when not wearing\n• Remove before swimming, exercising, or showering');

INSERT INTO public.categories (name) VALUES 
  ('Earrings'),
  ('Rings'),
  ('Necklaces'),
  ('Bracelets');

INSERT INTO public.brands (name) VALUES 
  ('Poshplex'),
  ('Signature Collection');