-- Add birthdate to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birthdate date;

-- Create SMS APIs table
CREATE TABLE public.sms_apis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name text NOT NULL,
  api_base_url text NOT NULL,
  http_method text NOT NULL DEFAULT 'POST',
  api_key text NOT NULL,
  sender_id text,
  phone_param_name text NOT NULL DEFAULT 'phone',
  message_param_name text NOT NULL DEFAULT 'message',
  header_params jsonb DEFAULT '{}',
  content_type text NOT NULL DEFAULT 'json',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create SMS Campaigns table
CREATE TABLE public.sms_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  message text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'one-time',
  status text NOT NULL DEFAULT 'draft',
  filters jsonb DEFAULT '{}',
  schedule_config jsonb DEFAULT '{}',
  is_birthday_campaign boolean NOT NULL DEFAULT false,
  birthday_send_time time,
  recipient_count integer DEFAULT 0,
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create SMS Campaign Logs table
CREATE TABLE public.sms_campaign_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.sms_campaigns(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response jsonb,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create SMS Birthday Logs table (prevent duplicate birthday SMS per year)
CREATE TABLE public.sms_birthday_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  year integer NOT NULL,
  campaign_id uuid REFERENCES public.sms_campaigns(id) ON DELETE SET NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id, year)
);

-- Enable RLS on all new tables
ALTER TABLE public.sms_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_birthday_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_apis
CREATE POLICY "Anyone can view sms_apis" ON public.sms_apis FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sms_apis" ON public.sms_apis FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update sms_apis" ON public.sms_apis FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete sms_apis" ON public.sms_apis FOR DELETE USING (true);

-- RLS Policies for sms_campaigns
CREATE POLICY "Anyone can view sms_campaigns" ON public.sms_campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sms_campaigns" ON public.sms_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update sms_campaigns" ON public.sms_campaigns FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete sms_campaigns" ON public.sms_campaigns FOR DELETE USING (true);

-- RLS Policies for sms_campaign_logs
CREATE POLICY "Anyone can view sms_campaign_logs" ON public.sms_campaign_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sms_campaign_logs" ON public.sms_campaign_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update sms_campaign_logs" ON public.sms_campaign_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete sms_campaign_logs" ON public.sms_campaign_logs FOR DELETE USING (true);

-- RLS Policies for sms_birthday_logs
CREATE POLICY "Anyone can view sms_birthday_logs" ON public.sms_birthday_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sms_birthday_logs" ON public.sms_birthday_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update sms_birthday_logs" ON public.sms_birthday_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete sms_birthday_logs" ON public.sms_birthday_logs FOR DELETE USING (true);

-- Trigger to ensure only one active SMS API
CREATE OR REPLACE FUNCTION public.ensure_single_active_sms_api()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.sms_apis SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_sms_api_trigger
BEFORE INSERT OR UPDATE ON public.sms_apis
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_sms_api();

-- Add updated_at triggers
CREATE TRIGGER update_sms_apis_updated_at
BEFORE UPDATE ON public.sms_apis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_campaigns_updated_at
BEFORE UPDATE ON public.sms_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();