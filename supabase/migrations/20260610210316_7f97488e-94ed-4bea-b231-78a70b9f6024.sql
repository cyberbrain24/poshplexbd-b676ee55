
-- 1) PROVIDER SETTINGS (single row)
CREATE TABLE public.wa_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL DEFAULT '',
  endpoint_url TEXT NOT NULL DEFAULT '',
  http_method TEXT NOT NULL DEFAULT 'POST',
  request_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  api_key TEXT NOT NULL DEFAULT '',
  business_phone_id TEXT NOT NULL DEFAULT '',
  sender_display_name TEXT NOT NULL DEFAULT 'POSHPLEX',
  default_language TEXT NOT NULL DEFAULT 'en',
  success_keyword TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_provider_settings TO authenticated;
GRANT ALL ON public.wa_provider_settings TO service_role;
ALTER TABLE public.wa_provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wa provider" ON public.wa_provider_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wa_provider_updated BEFORE UPDATE ON public.wa_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) TEMPLATES
CREATE TABLE public.wa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  category TEXT NOT NULL DEFAULT 'marketing',
  header_type TEXT NOT NULL DEFAULT 'none',
  media_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_templates TO authenticated;
GRANT ALL ON public.wa_templates TO service_role;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wa templates" ON public.wa_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wa_templates_updated BEFORE UPDATE ON public.wa_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) CAMPAIGNS
CREATE TABLE public.wa_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.wa_templates(id) ON DELETE SET NULL,
  body_snapshot TEXT NOT NULL DEFAULT '',
  media_url TEXT NOT NULL DEFAULT '',
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_campaigns TO authenticated;
GRANT ALL ON public.wa_campaigns TO service_role;
ALTER TABLE public.wa_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wa campaigns" ON public.wa_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wa_campaigns_updated BEFORE UPDATE ON public.wa_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) MESSAGES
CREATE TABLE public.wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.wa_campaigns(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  template_key TEXT,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_messages_campaign ON public.wa_messages(campaign_id);
CREATE INDEX idx_wa_messages_created ON public.wa_messages(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_messages TO authenticated;
GRANT ALL ON public.wa_messages TO service_role;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wa messages" ON public.wa_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5) SUPPRESSION
CREATE TABLE public.wa_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'unsubscribe',
  source TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_suppression TO authenticated;
GRANT INSERT ON public.wa_suppression TO anon;
GRANT ALL ON public.wa_suppression TO service_role;
ALTER TABLE public.wa_suppression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage wa suppression" ON public.wa_suppression FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can opt out" ON public.wa_suppression FOR INSERT TO anon WITH CHECK (true);

-- Seed single provider row
INSERT INTO public.wa_provider_settings (provider_name, endpoint_url, http_method, headers, request_template)
VALUES (
  'Meta Cloud API',
  'https://graph.facebook.com/v20.0/{business_phone_id}/messages',
  'POST',
  '{"Authorization":"Bearer {api_key}","Content-Type":"application/json"}'::jsonb,
  '{"messaging_product":"whatsapp","to":"{to}","type":"text","text":{"body":"{body}"}}'::jsonb
);

-- Seed 14 fashion-commerce templates
INSERT INTO public.wa_templates (event_key, name, category, body, variables) VALUES
('order_placed','Order Placed','transactional','Hi {name}, thanks for your POSHPLEX order {order_number}. Total: ৳{total}. We''ll notify you when it ships.','["name","order_number","total"]'::jsonb),
('order_shipped','Order Shipped','transactional','Good news {name}! Your order {order_number} is on the way. Track: {tracking}','["name","order_number","tracking"]'::jsonb),
('order_delivered','Order Delivered','transactional','Hi {name}, your POSHPLEX order {order_number} has been delivered. Enjoy your fit!','["name","order_number"]'::jsonb),
('cod_confirmation','COD Confirmation','transactional','Hi {name}, please confirm your COD order {order_number} for ৳{total}. Reply YES to confirm.','["name","order_number","total"]'::jsonb),
('cart_abandoned','Cart Abandoned','marketing','Hi {name}, your POSHPLEX cart is waiting. Complete checkout: {url}','["name","url"]'::jsonb),
('back_in_stock','Back In Stock','marketing','{name}, {product} is back in stock at POSHPLEX. Grab it: {url}','["name","product","url"]'::jsonb),
('price_drop','Price Drop','marketing','Hey {name}, the price just dropped on {product}. Shop now: {url}','["name","product","url"]'::jsonb),
('new_drop_announcement','New Drop','marketing','New drop just landed at POSHPLEX. Be first: {url}','["url"]'::jsonb),
('flash_sale','Flash Sale','marketing','Flash sale at POSHPLEX — {discount} off everything for {hours}h. Shop: {url}','["discount","hours","url"]'::jsonb),
('lookbook_share','Lookbook','marketing','{name}, our latest lookbook is live. See the styling: {url}','["name","url"]'::jsonb),
('review_request','Review Request','marketing','Hi {name}, how was order {order_number}? Drop a quick review: {url}','["name","order_number","url"]'::jsonb),
('winback_30d','Winback (30 days)','marketing','{name}, we miss you at POSHPLEX. Here''s {discount} off your next order: code {code}','["name","discount","code"]'::jsonb),
('birthday_offer','Birthday Offer','marketing','Happy birthday {name}! Enjoy {discount} off today with code {code}.','["name","discount","code"]'::jsonb),
('membership_welcome','Membership Welcome','marketing','Welcome to POSHPLEX {tier}, {name}. Your perks are unlocked: {url}','["name","tier","url"]'::jsonb);
