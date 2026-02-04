-- Create divisions table
CREATE TABLE public.divisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create thanas table (linked to divisions)
CREATE TABLE public.thanas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_types table (membership types)
CREATE TABLE public.customer_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  division_id UUID REFERENCES public.divisions(id),
  thana_id UUID REFERENCES public.thanas(id),
  address TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  customer_type_id UUID REFERENCES public.customer_types(id),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promo_usages table
CREATE TABLE public.promo_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  promo_code TEXT NOT NULL,
  benefit_type TEXT,
  benefit_amount NUMERIC,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_usages ENABLE ROW LEVEL SECURITY;

-- RLS policies for divisions
CREATE POLICY "Anyone can view divisions" ON public.divisions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert divisions" ON public.divisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update divisions" ON public.divisions FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete divisions" ON public.divisions FOR DELETE USING (true);

-- RLS policies for thanas
CREATE POLICY "Anyone can view thanas" ON public.thanas FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert thanas" ON public.thanas FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update thanas" ON public.thanas FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete thanas" ON public.thanas FOR DELETE USING (true);

-- RLS policies for customer_types
CREATE POLICY "Anyone can view customer_types" ON public.customer_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert customer_types" ON public.customer_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customer_types" ON public.customer_types FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete customer_types" ON public.customer_types FOR DELETE USING (true);

-- RLS policies for customers
CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE USING (true);

-- RLS policies for promo_usages
CREATE POLICY "Anyone can view promo_usages" ON public.promo_usages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert promo_usages" ON public.promo_usages FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update promo_usages" ON public.promo_usages FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete promo_usages" ON public.promo_usages FOR DELETE USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_divisions_updated_at BEFORE UPDATE ON public.divisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_thanas_updated_at BEFORE UPDATE ON public.thanas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customer_types_updated_at BEFORE UPDATE ON public.customer_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_thanas_division_id ON public.thanas(division_id);
CREATE INDEX idx_customers_division_id ON public.customers(division_id);
CREATE INDEX idx_customers_thana_id ON public.customers(thana_id);
CREATE INDEX idx_customers_customer_type_id ON public.customers(customer_type_id);
CREATE INDEX idx_customers_gender ON public.customers(gender);
CREATE INDEX idx_promo_usages_customer_id ON public.promo_usages(customer_id);
CREATE INDEX idx_customers_search ON public.customers USING gin(to_tsvector('english', name || ' ' || phone || ' ' || COALESCE(email, '') || ' ' || COALESCE(address, '')));