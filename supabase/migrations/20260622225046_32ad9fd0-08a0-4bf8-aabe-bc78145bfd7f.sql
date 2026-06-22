DROP TABLE IF EXISTS public.image_migration_log CASCADE;
DROP TABLE IF EXISTS public.meta_conversations CASCADE;
DROP TABLE IF EXISTS public.product_variant_shared_links CASCADE;
DROP TABLE IF EXISTS public.shared_variant_categories CASCADE;

DROP FUNCTION IF EXISTS public.ensure_single_default_address() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_active_email_api() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_active_sms_api() CASCADE;
DROP FUNCTION IF EXISTS public.admin_list_schema() CASCADE;