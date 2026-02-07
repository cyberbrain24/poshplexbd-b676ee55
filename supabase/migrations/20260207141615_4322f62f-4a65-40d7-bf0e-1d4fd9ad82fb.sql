-- ============================================================
-- SYSTEM MODULES TABLE
-- Stores the activation state of all admin modules
-- ============================================================
CREATE TABLE public.system_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Package',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_core BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_module_key TEXT,
  routes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view system_modules" ON public.system_modules
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update system_modules" ON public.system_modules
  FOR UPDATE USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_system_modules_updated_at
  BEFORE UPDATE ON public.system_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default modules
INSERT INTO public.system_modules (module_key, name, description, icon, is_active, is_core, sort_order, routes) VALUES
-- Core modules (cannot be deactivated)
('dashboard', 'Dashboard', 'Main admin dashboard with analytics', 'LayoutDashboard', true, true, 0, ARRAY['/admin']),
('modules', 'Module Manager', 'Manage system modules', 'Puzzle', true, true, 1, ARRAY['/admin/modules']),

-- Product Module Group
('products', 'Products', 'Product catalog management', 'Package', true, false, 10, ARRAY['/admin/products']),
('product_edits', 'Product Edits', 'Colors, sizes, materials, and more', 'Settings2', true, false, 11, ARRAY['/admin/colors', '/admin/sizes', '/admin/materials', '/admin/size-guides', '/admin/care-instructions', '/admin/categories', '/admin/brands']),

-- Orders Module Group
('orders', 'Orders', 'Order management and fulfillment', 'ShoppingCart', true, false, 20, ARRAY['/admin/orders', '/admin/verification-queue', '/admin/inventory', '/admin/returns', '/admin/risk-management', '/admin/payment-methods']),

-- Accounts Module
('accounts', 'Accounts', 'Financial accounts management', 'Wallet', true, false, 30, ARRAY['/admin/accounts']),
('account_edits', 'Accounts Edits', 'Income and expense categories', 'Settings2', true, false, 31, ARRAY['/admin/accounts-list', '/admin/income-categories', '/admin/expense-categories']),

-- Customers Module Group
('customers', 'Customers', 'Customer relationship management', 'Users', true, false, 40, ARRAY['/admin/customers']),
('customer_edits', 'Customer Edits', 'Divisions, thanas, and customer types', 'Settings2', true, false, 41, ARRAY['/admin/divisions', '/admin/thanas', '/admin/customer-types']),

-- Marketing Modules
('sms_marketing', 'SMS Marketing', 'SMS campaigns and API configuration', 'MessageSquare', true, false, 50, ARRAY['/admin/sms-api', '/admin/sms-marketing']),
('email_marketing', 'Email Marketing', 'Email campaigns and API configuration', 'Mail', true, false, 51, ARRAY['/admin/email-api', '/admin/email-marketing']),
('whatsapp_marketing', 'WhatsApp Marketing', 'WhatsApp campaigns and inbox', 'MessageCircle', true, false, 52, ARRAY['/admin/whatsapp-api', '/admin/whatsapp-marketing', '/admin/whatsapp-inbox']),
('instagram_marketing', 'Instagram Marketing', 'Instagram campaigns and inbox', 'Instagram', true, false, 53, ARRAY['/admin/instagram-api', '/admin/instagram-marketing', '/admin/instagram-inbox']),

-- SEO & Settings
('seo', 'SEO Manager', 'Search engine optimization tools', 'Globe', true, false, 60, ARRAY['/admin/seo']),
('site_settings', 'Site Settings', 'Site configuration and branding', 'Settings2', true, false, 61, ARRAY['/admin/site-settings']);