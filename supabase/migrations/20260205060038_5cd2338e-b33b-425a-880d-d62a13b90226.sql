
-- Email API configurations table
CREATE TABLE public.email_apis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name TEXT NOT NULL,
  connection_type TEXT NOT NULL DEFAULT 'api', -- 'smtp' or 'api'
  api_base_url TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  username TEXT,
  api_key TEXT NOT NULL,
  password TEXT,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  header_params JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_plain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email campaigns table
CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_plain TEXT,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  filters JSONB DEFAULT '{}'::jsonb,
  campaign_type TEXT NOT NULL DEFAULT 'one-time',
  schedule_config JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  recipient_count INTEGER DEFAULT 0,
  is_birthday_campaign BOOLEAN NOT NULL DEFAULT false,
  birthday_send_time TIME,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email campaign logs table
CREATE TABLE public.email_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email birthday logs (prevent duplicates per year)
CREATE TABLE public.email_birthday_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, year)
);

-- Email tracking table (future-proof)
CREATE TABLE public.email_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES public.email_campaign_logs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'open', 'click'
  event_data JSONB,
  event_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.email_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_birthday_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_apis
CREATE POLICY "Anyone can view email_apis" ON public.email_apis FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_apis" ON public.email_apis FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_apis" ON public.email_apis FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_apis" ON public.email_apis FOR DELETE USING (true);

-- RLS policies for email_templates
CREATE POLICY "Anyone can view email_templates" ON public.email_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_templates" ON public.email_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_templates" ON public.email_templates FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_templates" ON public.email_templates FOR DELETE USING (true);

-- RLS policies for email_campaigns
CREATE POLICY "Anyone can view email_campaigns" ON public.email_campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_campaigns" ON public.email_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_campaigns" ON public.email_campaigns FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_campaigns" ON public.email_campaigns FOR DELETE USING (true);

-- RLS policies for email_campaign_logs
CREATE POLICY "Anyone can view email_campaign_logs" ON public.email_campaign_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_campaign_logs" ON public.email_campaign_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_campaign_logs" ON public.email_campaign_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_campaign_logs" ON public.email_campaign_logs FOR DELETE USING (true);

-- RLS policies for email_birthday_logs
CREATE POLICY "Anyone can view email_birthday_logs" ON public.email_birthday_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_birthday_logs" ON public.email_birthday_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_birthday_logs" ON public.email_birthday_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_birthday_logs" ON public.email_birthday_logs FOR DELETE USING (true);

-- RLS policies for email_tracking
CREATE POLICY "Anyone can view email_tracking" ON public.email_tracking FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert email_tracking" ON public.email_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update email_tracking" ON public.email_tracking FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete email_tracking" ON public.email_tracking FOR DELETE USING (true);

-- Trigger to ensure only one active email API
CREATE OR REPLACE FUNCTION public.ensure_single_active_email_api()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.email_apis SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_email_api_trigger
BEFORE INSERT OR UPDATE ON public.email_apis
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_email_api();

-- Updated_at triggers
CREATE TRIGGER update_email_apis_updated_at BEFORE UPDATE ON public.email_apis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
