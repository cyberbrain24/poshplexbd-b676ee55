-- Step 1: Create app_role enum type
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Step 3: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 5: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Step 6: RLS policies for user_roles table (only admins can manage roles)
CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles" 
  ON public.user_roles FOR INSERT 
  TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" 
  ON public.user_roles FOR UPDATE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" 
  ON public.user_roles FOR DELETE 
  TO authenticated 
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Drop ALL existing permissive policies and replace with proper ones

-- ACCOUNTS table
DROP POLICY IF EXISTS "Anyone can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can insert accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Authenticated users can delete accounts" ON public.accounts;

CREATE POLICY "Admins can view accounts" ON public.accounts FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update accounts" ON public.accounts FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete accounts" ON public.accounts FOR DELETE TO authenticated USING (public.is_admin());

-- BLOG_CATEGORIES table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view blog_categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can insert blog_categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can update blog_categories" ON public.blog_categories;
DROP POLICY IF EXISTS "Authenticated users can delete blog_categories" ON public.blog_categories;

CREATE POLICY "Public can view blog_categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert blog_categories" ON public.blog_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update blog_categories" ON public.blog_categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete blog_categories" ON public.blog_categories FOR DELETE TO authenticated USING (public.is_admin());

-- BLOG_POST_PRODUCTS table
DROP POLICY IF EXISTS "Anyone can view blog_post_products" ON public.blog_post_products;
DROP POLICY IF EXISTS "Authenticated users can insert blog_post_products" ON public.blog_post_products;
DROP POLICY IF EXISTS "Authenticated users can update blog_post_products" ON public.blog_post_products;
DROP POLICY IF EXISTS "Authenticated users can delete blog_post_products" ON public.blog_post_products;

CREATE POLICY "Public can view blog_post_products" ON public.blog_post_products FOR SELECT USING (true);
CREATE POLICY "Admins can insert blog_post_products" ON public.blog_post_products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update blog_post_products" ON public.blog_post_products FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete blog_post_products" ON public.blog_post_products FOR DELETE TO authenticated USING (public.is_admin());

-- BLOG_POSTS table (published = public, draft = admin only)
DROP POLICY IF EXISTS "Anyone can view published blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can insert blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can delete blog_posts" ON public.blog_posts;

CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admins can insert blog_posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update blog_posts" ON public.blog_posts FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete blog_posts" ON public.blog_posts FOR DELETE TO authenticated USING (public.is_admin());

-- BRANDS table (public read for catalog, admin write)
DROP POLICY IF EXISTS "Anyone can view brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can update brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can delete brands" ON public.brands;

CREATE POLICY "Public can view brands" ON public.brands FOR SELECT USING (true);
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE TO authenticated USING (public.is_admin());

-- CARE_INSTRUCTIONS table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view care_instructions" ON public.care_instructions;
DROP POLICY IF EXISTS "Authenticated users can insert care_instructions" ON public.care_instructions;
DROP POLICY IF EXISTS "Authenticated users can update care_instructions" ON public.care_instructions;
DROP POLICY IF EXISTS "Authenticated users can delete care_instructions" ON public.care_instructions;

CREATE POLICY "Public can view care_instructions" ON public.care_instructions FOR SELECT USING (true);
CREATE POLICY "Admins can insert care_instructions" ON public.care_instructions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update care_instructions" ON public.care_instructions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete care_instructions" ON public.care_instructions FOR DELETE TO authenticated USING (public.is_admin());

-- CATEGORIES table (public read for catalog, admin write)
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin());

-- COLORS table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view colors" ON public.colors;
DROP POLICY IF EXISTS "Authenticated users can insert colors" ON public.colors;
DROP POLICY IF EXISTS "Authenticated users can update colors" ON public.colors;
DROP POLICY IF EXISTS "Authenticated users can delete colors" ON public.colors;

CREATE POLICY "Public can view colors" ON public.colors FOR SELECT USING (true);
CREATE POLICY "Admins can insert colors" ON public.colors FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update colors" ON public.colors FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete colors" ON public.colors FOR DELETE TO authenticated USING (public.is_admin());

-- CUSTOMER_TYPES table (admin only - sensitive business data)
DROP POLICY IF EXISTS "Anyone can view customer_types" ON public.customer_types;
DROP POLICY IF EXISTS "Authenticated users can insert customer_types" ON public.customer_types;
DROP POLICY IF EXISTS "Authenticated users can update customer_types" ON public.customer_types;
DROP POLICY IF EXISTS "Authenticated users can delete customer_types" ON public.customer_types;

CREATE POLICY "Admins can view customer_types" ON public.customer_types FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert customer_types" ON public.customer_types FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update customer_types" ON public.customer_types FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete customer_types" ON public.customer_types FOR DELETE TO authenticated USING (public.is_admin());

-- CUSTOMERS table (admin only - PII)
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;

CREATE POLICY "Admins can view customers" ON public.customers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete customers" ON public.customers FOR DELETE TO authenticated USING (public.is_admin());

-- DIVISIONS table (admin only)
DROP POLICY IF EXISTS "Anyone can view divisions" ON public.divisions;
DROP POLICY IF EXISTS "Authenticated users can insert divisions" ON public.divisions;
DROP POLICY IF EXISTS "Authenticated users can update divisions" ON public.divisions;
DROP POLICY IF EXISTS "Authenticated users can delete divisions" ON public.divisions;

CREATE POLICY "Admins can view divisions" ON public.divisions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert divisions" ON public.divisions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update divisions" ON public.divisions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete divisions" ON public.divisions FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_APIS table (admin only - credentials)
DROP POLICY IF EXISTS "Anyone can view email_apis" ON public.email_apis;
DROP POLICY IF EXISTS "Authenticated users can insert email_apis" ON public.email_apis;
DROP POLICY IF EXISTS "Authenticated users can update email_apis" ON public.email_apis;
DROP POLICY IF EXISTS "Authenticated users can delete email_apis" ON public.email_apis;

CREATE POLICY "Admins can view email_apis" ON public.email_apis FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_apis" ON public.email_apis FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_apis" ON public.email_apis FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_apis" ON public.email_apis FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_BIRTHDAY_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view email_birthday_logs" ON public.email_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email_birthday_logs" ON public.email_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can update email_birthday_logs" ON public.email_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can delete email_birthday_logs" ON public.email_birthday_logs;

CREATE POLICY "Admins can view email_birthday_logs" ON public.email_birthday_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_birthday_logs" ON public.email_birthday_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_birthday_logs" ON public.email_birthday_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_birthday_logs" ON public.email_birthday_logs FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_CAMPAIGN_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view email_campaign_logs" ON public.email_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can insert email_campaign_logs" ON public.email_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can update email_campaign_logs" ON public.email_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can delete email_campaign_logs" ON public.email_campaign_logs;

CREATE POLICY "Admins can view email_campaign_logs" ON public.email_campaign_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_campaign_logs" ON public.email_campaign_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_campaign_logs" ON public.email_campaign_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_campaign_logs" ON public.email_campaign_logs FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_CAMPAIGNS table (admin only)
DROP POLICY IF EXISTS "Anyone can view email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update email_campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete email_campaigns" ON public.email_campaigns;

CREATE POLICY "Admins can view email_campaigns" ON public.email_campaigns FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_campaigns" ON public.email_campaigns FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_campaigns" ON public.email_campaigns FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_campaigns" ON public.email_campaigns FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_TEMPLATES table (admin only)
DROP POLICY IF EXISTS "Anyone can view email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can insert email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can update email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Authenticated users can delete email_templates" ON public.email_templates;

CREATE POLICY "Admins can view email_templates" ON public.email_templates FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_templates" ON public.email_templates FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_templates" ON public.email_templates FOR DELETE TO authenticated USING (public.is_admin());

-- EMAIL_TRACKING table (admin only)
DROP POLICY IF EXISTS "Anyone can view email_tracking" ON public.email_tracking;
DROP POLICY IF EXISTS "Authenticated users can insert email_tracking" ON public.email_tracking;
DROP POLICY IF EXISTS "Authenticated users can update email_tracking" ON public.email_tracking;
DROP POLICY IF EXISTS "Authenticated users can delete email_tracking" ON public.email_tracking;

CREATE POLICY "Admins can view email_tracking" ON public.email_tracking FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert email_tracking" ON public.email_tracking FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update email_tracking" ON public.email_tracking FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete email_tracking" ON public.email_tracking FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_ANALYTICS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_analytics" ON public.instagram_analytics;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_analytics" ON public.instagram_analytics;
DROP POLICY IF EXISTS "Authenticated users can update instagram_analytics" ON public.instagram_analytics;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_analytics" ON public.instagram_analytics;

CREATE POLICY "Admins can view instagram_analytics" ON public.instagram_analytics FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_analytics" ON public.instagram_analytics FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_analytics" ON public.instagram_analytics FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_analytics" ON public.instagram_analytics FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_APIS table (admin only - credentials)
DROP POLICY IF EXISTS "Anyone can view instagram_apis" ON public.instagram_apis;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_apis" ON public.instagram_apis;
DROP POLICY IF EXISTS "Authenticated users can update instagram_apis" ON public.instagram_apis;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_apis" ON public.instagram_apis;

CREATE POLICY "Admins can view instagram_apis" ON public.instagram_apis FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_apis" ON public.instagram_apis FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_apis" ON public.instagram_apis FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_apis" ON public.instagram_apis FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_AUTOMATIONS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_automations" ON public.instagram_automations;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_automations" ON public.instagram_automations;
DROP POLICY IF EXISTS "Authenticated users can update instagram_automations" ON public.instagram_automations;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_automations" ON public.instagram_automations;

CREATE POLICY "Admins can view instagram_automations" ON public.instagram_automations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_automations" ON public.instagram_automations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_automations" ON public.instagram_automations FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_automations" ON public.instagram_automations FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_CAMPAIGN_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_campaign_logs" ON public.instagram_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_campaign_logs" ON public.instagram_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can update instagram_campaign_logs" ON public.instagram_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_campaign_logs" ON public.instagram_campaign_logs;

CREATE POLICY "Admins can view instagram_campaign_logs" ON public.instagram_campaign_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_campaign_logs" ON public.instagram_campaign_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_campaign_logs" ON public.instagram_campaign_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_campaign_logs" ON public.instagram_campaign_logs FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_CAMPAIGNS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_campaigns" ON public.instagram_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_campaigns" ON public.instagram_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update instagram_campaigns" ON public.instagram_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_campaigns" ON public.instagram_campaigns;

CREATE POLICY "Admins can view instagram_campaigns" ON public.instagram_campaigns FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_campaigns" ON public.instagram_campaigns FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_campaigns" ON public.instagram_campaigns FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_campaigns" ON public.instagram_campaigns FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_CONVERSATIONS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_conversations" ON public.instagram_conversations;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_conversations" ON public.instagram_conversations;
DROP POLICY IF EXISTS "Authenticated users can update instagram_conversations" ON public.instagram_conversations;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_conversations" ON public.instagram_conversations;

CREATE POLICY "Admins can view instagram_conversations" ON public.instagram_conversations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_conversations" ON public.instagram_conversations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_conversations" ON public.instagram_conversations FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_conversations" ON public.instagram_conversations FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_ICE_BREAKERS table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_ice_breakers" ON public.instagram_ice_breakers;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_ice_breakers" ON public.instagram_ice_breakers;
DROP POLICY IF EXISTS "Authenticated users can update instagram_ice_breakers" ON public.instagram_ice_breakers;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_ice_breakers" ON public.instagram_ice_breakers;

CREATE POLICY "Admins can view instagram_ice_breakers" ON public.instagram_ice_breakers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_ice_breakers" ON public.instagram_ice_breakers FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_ice_breakers" ON public.instagram_ice_breakers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_ice_breakers" ON public.instagram_ice_breakers FOR DELETE TO authenticated USING (public.is_admin());

-- INSTAGRAM_MESSAGES table (admin only)
DROP POLICY IF EXISTS "Anyone can view instagram_messages" ON public.instagram_messages;
DROP POLICY IF EXISTS "Authenticated users can insert instagram_messages" ON public.instagram_messages;
DROP POLICY IF EXISTS "Authenticated users can update instagram_messages" ON public.instagram_messages;
DROP POLICY IF EXISTS "Authenticated users can delete instagram_messages" ON public.instagram_messages;

CREATE POLICY "Admins can view instagram_messages" ON public.instagram_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert instagram_messages" ON public.instagram_messages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update instagram_messages" ON public.instagram_messages FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete instagram_messages" ON public.instagram_messages FOR DELETE TO authenticated USING (public.is_admin());

-- MATERIALS table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON public.materials;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON public.materials;

CREATE POLICY "Public can view materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Admins can insert materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update materials" ON public.materials FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete materials" ON public.materials FOR DELETE TO authenticated USING (public.is_admin());

-- PRODUCT_IMAGES table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can insert product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can update product_images" ON public.product_images;
DROP POLICY IF EXISTS "Authenticated users can delete product_images" ON public.product_images;

CREATE POLICY "Public can view product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert product_images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update product_images" ON public.product_images FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete product_images" ON public.product_images FOR DELETE TO authenticated USING (public.is_admin());

-- PRODUCT_VARIANTS table (public read selling_price only via view, admin full access)
DROP POLICY IF EXISTS "Anyone can view product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can insert product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can update product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Authenticated users can delete product_variants" ON public.product_variants;

CREATE POLICY "Public can view product_variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can insert product_variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update product_variants" ON public.product_variants FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete product_variants" ON public.product_variants FOR DELETE TO authenticated USING (public.is_admin());

-- PRODUCTS table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

-- PROMO_USAGES table (admin only)
DROP POLICY IF EXISTS "Anyone can view promo_usages" ON public.promo_usages;
DROP POLICY IF EXISTS "Authenticated users can insert promo_usages" ON public.promo_usages;
DROP POLICY IF EXISTS "Authenticated users can update promo_usages" ON public.promo_usages;
DROP POLICY IF EXISTS "Authenticated users can delete promo_usages" ON public.promo_usages;

CREATE POLICY "Admins can view promo_usages" ON public.promo_usages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert promo_usages" ON public.promo_usages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update promo_usages" ON public.promo_usages FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete promo_usages" ON public.promo_usages FOR DELETE TO authenticated USING (public.is_admin());

-- SIZE_GUIDES table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view size_guides" ON public.size_guides;
DROP POLICY IF EXISTS "Authenticated users can insert size_guides" ON public.size_guides;
DROP POLICY IF EXISTS "Authenticated users can update size_guides" ON public.size_guides;
DROP POLICY IF EXISTS "Authenticated users can delete size_guides" ON public.size_guides;

CREATE POLICY "Public can view size_guides" ON public.size_guides FOR SELECT USING (true);
CREATE POLICY "Admins can insert size_guides" ON public.size_guides FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update size_guides" ON public.size_guides FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete size_guides" ON public.size_guides FOR DELETE TO authenticated USING (public.is_admin());

-- SIZES table (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view sizes" ON public.sizes;
DROP POLICY IF EXISTS "Authenticated users can insert sizes" ON public.sizes;
DROP POLICY IF EXISTS "Authenticated users can update sizes" ON public.sizes;
DROP POLICY IF EXISTS "Authenticated users can delete sizes" ON public.sizes;

CREATE POLICY "Public can view sizes" ON public.sizes FOR SELECT USING (true);
CREATE POLICY "Admins can insert sizes" ON public.sizes FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sizes" ON public.sizes FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete sizes" ON public.sizes FOR DELETE TO authenticated USING (public.is_admin());

-- SMS_APIS table (admin only - credentials)
DROP POLICY IF EXISTS "Anyone can view sms_apis" ON public.sms_apis;
DROP POLICY IF EXISTS "Authenticated users can insert sms_apis" ON public.sms_apis;
DROP POLICY IF EXISTS "Authenticated users can update sms_apis" ON public.sms_apis;
DROP POLICY IF EXISTS "Authenticated users can delete sms_apis" ON public.sms_apis;

CREATE POLICY "Admins can view sms_apis" ON public.sms_apis FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert sms_apis" ON public.sms_apis FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sms_apis" ON public.sms_apis FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete sms_apis" ON public.sms_apis FOR DELETE TO authenticated USING (public.is_admin());

-- SMS_BIRTHDAY_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view sms_birthday_logs" ON public.sms_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can insert sms_birthday_logs" ON public.sms_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can update sms_birthday_logs" ON public.sms_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can delete sms_birthday_logs" ON public.sms_birthday_logs;

CREATE POLICY "Admins can view sms_birthday_logs" ON public.sms_birthday_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert sms_birthday_logs" ON public.sms_birthday_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sms_birthday_logs" ON public.sms_birthday_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete sms_birthday_logs" ON public.sms_birthday_logs FOR DELETE TO authenticated USING (public.is_admin());

-- SMS_CAMPAIGN_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view sms_campaign_logs" ON public.sms_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can insert sms_campaign_logs" ON public.sms_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can update sms_campaign_logs" ON public.sms_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can delete sms_campaign_logs" ON public.sms_campaign_logs;

CREATE POLICY "Admins can view sms_campaign_logs" ON public.sms_campaign_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert sms_campaign_logs" ON public.sms_campaign_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sms_campaign_logs" ON public.sms_campaign_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete sms_campaign_logs" ON public.sms_campaign_logs FOR DELETE TO authenticated USING (public.is_admin());

-- SMS_CAMPAIGNS table (admin only)
DROP POLICY IF EXISTS "Anyone can view sms_campaigns" ON public.sms_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert sms_campaigns" ON public.sms_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update sms_campaigns" ON public.sms_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete sms_campaigns" ON public.sms_campaigns;

CREATE POLICY "Admins can view sms_campaigns" ON public.sms_campaigns FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert sms_campaigns" ON public.sms_campaigns FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update sms_campaigns" ON public.sms_campaigns FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete sms_campaigns" ON public.sms_campaigns FOR DELETE TO authenticated USING (public.is_admin());

-- THANAS table (admin only)
DROP POLICY IF EXISTS "Anyone can view thanas" ON public.thanas;
DROP POLICY IF EXISTS "Authenticated users can insert thanas" ON public.thanas;
DROP POLICY IF EXISTS "Authenticated users can update thanas" ON public.thanas;
DROP POLICY IF EXISTS "Authenticated users can delete thanas" ON public.thanas;

CREATE POLICY "Admins can view thanas" ON public.thanas FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert thanas" ON public.thanas FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update thanas" ON public.thanas FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete thanas" ON public.thanas FOR DELETE TO authenticated USING (public.is_admin());

-- TRANSACTION_CATEGORIES table (admin only)
DROP POLICY IF EXISTS "Anyone can view transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Authenticated users can insert transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Authenticated users can update transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Authenticated users can delete transaction_categories" ON public.transaction_categories;

CREATE POLICY "Admins can view transaction_categories" ON public.transaction_categories FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert transaction_categories" ON public.transaction_categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update transaction_categories" ON public.transaction_categories FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete transaction_categories" ON public.transaction_categories FOR DELETE TO authenticated USING (public.is_admin());

-- TRANSACTIONS table (admin only - financial data)
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON public.transactions;

CREATE POLICY "Admins can view transactions" ON public.transactions FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete transactions" ON public.transactions FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_APIS table (admin only - credentials)
DROP POLICY IF EXISTS "Anyone can view whatsapp_apis" ON public.whatsapp_apis;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_apis" ON public.whatsapp_apis;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_apis" ON public.whatsapp_apis;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_apis" ON public.whatsapp_apis;

CREATE POLICY "Admins can view whatsapp_apis" ON public.whatsapp_apis FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_apis" ON public.whatsapp_apis FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_apis" ON public.whatsapp_apis FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_apis" ON public.whatsapp_apis FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_BIRTHDAY_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_birthday_logs" ON public.whatsapp_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_birthday_logs" ON public.whatsapp_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_birthday_logs" ON public.whatsapp_birthday_logs;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_birthday_logs" ON public.whatsapp_birthday_logs;

CREATE POLICY "Admins can view whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_BUTTON_CLICKS table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_button_clicks" ON public.whatsapp_button_clicks;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_button_clicks" ON public.whatsapp_button_clicks;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_button_clicks" ON public.whatsapp_button_clicks;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_button_clicks" ON public.whatsapp_button_clicks;

CREATE POLICY "Admins can view whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_CAMPAIGN_LOGS table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_campaign_logs" ON public.whatsapp_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_campaign_logs" ON public.whatsapp_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_campaign_logs" ON public.whatsapp_campaign_logs;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_campaign_logs" ON public.whatsapp_campaign_logs;

CREATE POLICY "Admins can view whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_CAMPAIGNS table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_campaigns" ON public.whatsapp_campaigns;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_campaigns" ON public.whatsapp_campaigns;

CREATE POLICY "Admins can view whatsapp_campaigns" ON public.whatsapp_campaigns FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_campaigns" ON public.whatsapp_campaigns FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_campaigns" ON public.whatsapp_campaigns FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_campaigns" ON public.whatsapp_campaigns FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_CONVERSATIONS table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_conversations" ON public.whatsapp_conversations;

CREATE POLICY "Admins can view whatsapp_conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_conversations" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_conversations" ON public.whatsapp_conversations FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_MESSAGES table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_messages" ON public.whatsapp_messages;

CREATE POLICY "Admins can view whatsapp_messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_messages" ON public.whatsapp_messages FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can delete whatsapp_messages" ON public.whatsapp_messages FOR DELETE TO authenticated USING (public.is_admin());

-- WHATSAPP_TEMPLATES table (admin only)
DROP POLICY IF EXISTS "Anyone can view whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Authenticated users can insert whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Authenticated users can update whatsapp_templates" ON public.whatsapp_templates;
DROP POLICY IF EXISTS "Authenticated users can delete whatsapp_templates" ON public.whatsapp_templates;

CREATE POLICY "Admins can view whatsapp_templates" ON public.whatsapp_templates FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert whatsapp_templates" ON public.whatsapp_templates FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update whatsapp_templates" ON public.whatsapp_templates FOR UPDATE TO authenticated USING (public.is_admin());