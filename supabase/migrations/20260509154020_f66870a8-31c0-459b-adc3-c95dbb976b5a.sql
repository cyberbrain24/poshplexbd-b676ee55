
-- 1. Provider settings (single row)
CREATE TABLE public.sms_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL DEFAULT 'Custom HTTP',
  endpoint_url TEXT,
  http_method TEXT NOT NULL DEFAULT 'POST',
  request_template JSONB NOT NULL DEFAULT '{"api_key":"{api_key}","sender_id":"{sender_id}","number":"{phone}","message":"{message}"}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{"Content-Type":"application/json"}'::jsonb,
  api_key TEXT,
  sender_id TEXT,
  success_keyword TEXT DEFAULT 'success',
  enabled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_provider_settings" ON public.sms_provider_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.ensure_single_sms_provider()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.sms_provider_settings) >= 1 AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only one sms_provider_settings row is allowed.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_single_sms_provider BEFORE INSERT ON public.sms_provider_settings
FOR EACH ROW EXECUTE FUNCTION public.ensure_single_sms_provider();
CREATE TRIGGER trg_sms_provider_updated BEFORE UPDATE ON public.sms_provider_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sms_provider_settings (provider_name) VALUES ('Custom HTTP');

-- 2. Templates
CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE, -- account_created | order_placed | order_shipped | order_delivered | custom slug
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT false, -- can't be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_templates" ON public.sms_templates FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_sms_templates_updated BEFORE UPDATE ON public.sms_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.sms_templates (event_key, name, body, is_system, enabled) VALUES
  ('account_created', 'Account Created', 'Hi {name}, welcome to POSHPLEX! Your account has been created. BE POSH WITH POSHPLEX.', true, true),
  ('order_placed',    'Order Placed',    'Hi {name}, your POSHPLEX order {order_number} for Tk {total} has been placed. Thank you!', true, true),
  ('order_shipped',   'Order Shipped',   'Hi {name}, your POSHPLEX order {order_number} has been shipped. Tracking: {tracking}.', true, false),
  ('order_delivered', 'Order Delivered', 'Hi {name}, your POSHPLEX order {order_number} has been delivered. Thank you for shopping!', true, false);

-- 3. Campaigns
CREATE TABLE public.sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb, -- {type:'all'|'membership'|'division'|'thana'|'manual', ids:[], phones:[]}
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sending | completed | failed
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sms_campaigns" ON public.sms_campaigns FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_sms_campaigns_updated BEFORE UPDATE ON public.sms_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Per-recipient log
CREATE TABLE public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  provider_response TEXT,
  campaign_id UUID REFERENCES public.sms_campaigns(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.sms_templates(id) ON DELETE SET NULL,
  customer_id UUID,
  order_id UUID,
  trigger_event TEXT, -- account_created | order_placed | bulk | manual | ai
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sms_messages_campaign ON public.sms_messages(campaign_id);
CREATE INDEX idx_sms_messages_created ON public.sms_messages(created_at DESC);
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view sms_messages" ON public.sms_messages FOR SELECT USING (is_admin());
CREATE POLICY "Admins delete sms_messages" ON public.sms_messages FOR DELETE USING (is_admin());
-- inserts are done via SECURITY DEFINER edge functions (service role bypass); no public insert policy needed.
