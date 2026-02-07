-- Drop all marketing-related tables
-- First drop tables with foreign key dependencies

-- SMS tables
DROP TABLE IF EXISTS public.sms_campaign_logs CASCADE;
DROP TABLE IF EXISTS public.sms_campaigns CASCADE;
DROP TABLE IF EXISTS public.sms_apis CASCADE;

-- Email tables
DROP TABLE IF EXISTS public.email_tracking CASCADE;
DROP TABLE IF EXISTS public.email_birthday_logs CASCADE;
DROP TABLE IF EXISTS public.email_campaign_logs CASCADE;
DROP TABLE IF EXISTS public.email_campaigns CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.email_apis CASCADE;

-- WhatsApp tables
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_campaign_logs CASCADE;
DROP TABLE IF EXISTS public.whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS public.whatsapp_templates CASCADE;
DROP TABLE IF EXISTS public.whatsapp_apis CASCADE;

-- Instagram tables
DROP TABLE IF EXISTS public.instagram_analytics CASCADE;
DROP TABLE IF EXISTS public.instagram_messages CASCADE;
DROP TABLE IF EXISTS public.instagram_conversations CASCADE;
DROP TABLE IF EXISTS public.instagram_campaign_logs CASCADE;
DROP TABLE IF EXISTS public.instagram_campaigns CASCADE;
DROP TABLE IF EXISTS public.instagram_automations CASCADE;
DROP TABLE IF EXISTS public.instagram_ice_breakers CASCADE;
DROP TABLE IF EXISTS public.instagram_apis CASCADE;

-- Update system_modules to remove marketing modules
DELETE FROM public.system_modules WHERE module_key IN (
  'sms_marketing',
  'email_marketing', 
  'whatsapp_marketing',
  'instagram_marketing',
  'sms_api',
  'email_api',
  'whatsapp_api',
  'instagram_api',
  'whatsapp_inbox',
  'instagram_inbox'
);