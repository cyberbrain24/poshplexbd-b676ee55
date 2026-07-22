
DROP FUNCTION IF EXISTS public.generate_short_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS public.generate_sku() CASCADE;
DROP FUNCTION IF EXISTS public.sync_customer_to_account() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_site_branding() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_site_settings() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_sms_provider() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_customer_for_account() CASCADE;
DROP FUNCTION IF EXISTS public.update_customer_risk_profile() CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status_from_items() CASCADE;
DROP FUNCTION IF EXISTS public.update_variant_stock_on_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.find_customer_ids_by_phone(text) CASCADE;

DROP TABLE IF EXISTS public.inventory_categories CASCADE;
