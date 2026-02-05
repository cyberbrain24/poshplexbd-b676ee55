
-- WhatsApp API Configuration
CREATE TABLE public.whatsapp_apis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL DEFAULT 'meta', -- 'meta', 'twilio', 'custom'
  provider_name TEXT NOT NULL,
  business_account_id TEXT,
  phone_number_id TEXT,
  access_token TEXT NOT NULL,
  phone_number TEXT,
  quality_rating TEXT DEFAULT 'green', -- 'green', 'yellow', 'red'
  webhook_url TEXT,
  webhook_verify_token TEXT,
  api_base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'disconnected', -- 'connected', 'disconnected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Message Templates (synced from Meta)
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL, -- Meta's template ID
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  category TEXT NOT NULL DEFAULT 'MARKETING', -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'
  template_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'document', 'interactive'
  header_type TEXT, -- 'none', 'text', 'image', 'video', 'document'
  header_text TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]'::jsonb, -- [{type: 'quick_reply', text: 'Yes'}, {type: 'url', text: 'Shop Now', url: '...'}]
  variables JSONB DEFAULT '[]'::jsonb, -- ['{{1}}', '{{2}}']
  status TEXT NOT NULL DEFAULT 'pending', -- 'approved', 'rejected', 'pending'
  meta_status TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Campaigns
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'document'
  variable_mapping JSONB DEFAULT '{}'::jsonb, -- {1: 'name', 2: 'order_id'}
  campaign_type TEXT NOT NULL DEFAULT 'one-time', -- 'one-time', 'scheduled', 'automated'
  automation_type TEXT, -- 'welcome', 'order_placed', 'order_shipped', 'cart_abandoned', 'birthday'
  filters JSONB DEFAULT '{}'::jsonb,
  schedule_config JSONB DEFAULT '{}'::jsonb,
  recipient_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'active', 'paused', 'completed'
  fallback_to_sms BOOLEAN DEFAULT false,
  exclude_recently_contacted BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Campaign Logs
CREATE TABLE public.whatsapp_campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.whatsapp_campaigns(id),
  customer_id UUID REFERENCES public.customers(id),
  phone TEXT NOT NULL,
  template_name TEXT,
  message_id TEXT, -- Meta's message ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  error_code TEXT,
  error_message TEXT,
  response JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Birthday Logs (prevent duplicates)
CREATE TABLE public.whatsapp_birthday_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  campaign_id UUID REFERENCES public.whatsapp_campaigns(id),
  year INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, year)
);

-- WhatsApp Conversations (2-way inbox)
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id),
  phone TEXT NOT NULL,
  customer_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'archived'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Messages (chat history)
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id TEXT, -- Meta's message ID
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'video', 'document', 'template', 'interactive'
  content TEXT,
  media_url TEXT,
  template_name TEXT,
  buttons_response TEXT, -- Quick reply or button clicked
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Button Clicks Tracking
CREATE TABLE public.whatsapp_button_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID REFERENCES public.whatsapp_campaign_logs(id),
  button_text TEXT NOT NULL,
  button_type TEXT, -- 'quick_reply', 'url', 'call'
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_apis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_birthday_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_button_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for all tables
CREATE POLICY "Anyone can view whatsapp_apis" ON public.whatsapp_apis FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_apis" ON public.whatsapp_apis FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_apis" ON public.whatsapp_apis FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_apis" ON public.whatsapp_apis FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_templates" ON public.whatsapp_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_templates" ON public.whatsapp_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_templates" ON public.whatsapp_templates FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_templates" ON public.whatsapp_templates FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_campaigns" ON public.whatsapp_campaigns FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_campaigns" ON public.whatsapp_campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_campaigns" ON public.whatsapp_campaigns FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_campaigns" ON public.whatsapp_campaigns FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_campaign_logs" ON public.whatsapp_campaign_logs FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_birthday_logs" ON public.whatsapp_birthday_logs FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_conversations" ON public.whatsapp_conversations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_conversations" ON public.whatsapp_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_conversations" ON public.whatsapp_conversations FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_conversations" ON public.whatsapp_conversations FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_messages" ON public.whatsapp_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_messages" ON public.whatsapp_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_messages" ON public.whatsapp_messages FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_messages" ON public.whatsapp_messages FOR DELETE USING (true);

CREATE POLICY "Anyone can view whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete whatsapp_button_clicks" ON public.whatsapp_button_clicks FOR DELETE USING (true);

-- Trigger to ensure only one active WhatsApp API
CREATE OR REPLACE FUNCTION public.ensure_single_active_whatsapp_api()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.whatsapp_apis SET is_active = false WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_whatsapp_api
BEFORE INSERT OR UPDATE ON public.whatsapp_apis
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_active_whatsapp_api();

-- Updated at triggers
CREATE TRIGGER update_whatsapp_apis_updated_at BEFORE UPDATE ON public.whatsapp_apis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_campaigns_updated_at BEFORE UPDATE ON public.whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
