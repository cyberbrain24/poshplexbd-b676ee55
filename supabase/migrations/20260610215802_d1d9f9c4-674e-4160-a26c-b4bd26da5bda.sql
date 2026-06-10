
-- =========== INSTAGRAM DM ===========
CREATE TABLE public.ig_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL DEFAULT '',
  endpoint_url TEXT NOT NULL DEFAULT '',
  http_method TEXT NOT NULL DEFAULT 'POST',
  request_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  access_token TEXT NOT NULL DEFAULT '',
  ig_user_id TEXT NOT NULL DEFAULT '',
  sender_display_name TEXT NOT NULL DEFAULT 'POSHPLEX',
  success_keyword TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_provider_settings TO authenticated;
GRANT ALL ON public.ig_provider_settings TO service_role;
ALTER TABLE public.ig_provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig provider" ON public.ig_provider_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ig_provider_updated BEFORE UPDATE ON public.ig_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ig_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'marketing',
  media_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_templates TO authenticated;
GRANT ALL ON public.ig_templates TO service_role;
ALTER TABLE public.ig_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig templates" ON public.ig_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ig_templates_updated BEFORE UPDATE ON public.ig_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ig_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_id TEXT NOT NULL UNIQUE,
  username TEXT,
  name TEXT,
  opted_in BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_subscribers TO authenticated;
GRANT ALL ON public.ig_subscribers TO service_role;
ALTER TABLE public.ig_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig subscribers" ON public.ig_subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ig_subscribers_updated BEFORE UPDATE ON public.ig_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ig_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.ig_templates(id) ON DELETE SET NULL,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_campaigns TO authenticated;
GRANT ALL ON public.ig_campaigns TO service_role;
ALTER TABLE public.ig_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig campaigns" ON public.ig_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ig_campaigns_updated BEFORE UPDATE ON public.ig_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ig_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ig_campaigns(id) ON DELETE SET NULL,
  to_id TEXT NOT NULL,
  template_key TEXT,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ig_messages_campaign ON public.ig_messages(campaign_id);
CREATE INDEX idx_ig_messages_created ON public.ig_messages(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_messages TO authenticated;
GRANT ALL ON public.ig_messages TO service_role;
ALTER TABLE public.ig_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig messages" ON public.ig_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ig_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_id TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'unsubscribe',
  source TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ig_suppression TO authenticated;
GRANT INSERT ON public.ig_suppression TO anon;
GRANT ALL ON public.ig_suppression TO service_role;
ALTER TABLE public.ig_suppression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ig suppression" ON public.ig_suppression FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can opt out ig" ON public.ig_suppression FOR INSERT TO anon WITH CHECK (true);

-- Seed IG provider + templates
INSERT INTO public.ig_provider_settings (provider_name, endpoint_url, http_method, headers, request_template)
VALUES (
  'Meta Graph API (Instagram)',
  'https://graph.facebook.com/v20.0/{ig_user_id}/messages?access_token={access_token}',
  'POST',
  '{"Content-Type":"application/json"}'::jsonb,
  '{"recipient":{"id":"{to}"},"message":{"text":"{body}"}}'::jsonb
);

INSERT INTO public.ig_templates (event_key, name, category, body, variables) VALUES
('new_drop_announcement','New Drop','marketing','New drop just landed at POSHPLEX. Be first: {url}','["url"]'::jsonb),
('flash_sale','Flash Sale','marketing','Flash sale at POSHPLEX — {discount} off for {hours}h. Shop: {url}','["discount","hours","url"]'::jsonb),
('lookbook_share','Lookbook','marketing','{name}, our latest lookbook is live: {url}','["name","url"]'::jsonb),
('back_in_stock','Back In Stock','marketing','{name}, {product} is back in stock. Grab it: {url}','["name","product","url"]'::jsonb),
('price_drop','Price Drop','marketing','Hey {name}, the price just dropped on {product}: {url}','["name","product","url"]'::jsonb),
('order_shipped','Order Shipped','transactional','Good news {name}! Order {order_number} is on the way. Track: {tracking}','["name","order_number","tracking"]'::jsonb),
('order_delivered','Order Delivered','transactional','Hi {name}, your POSHPLEX order {order_number} has been delivered. Enjoy!','["name","order_number"]'::jsonb),
('review_request','Review Request','marketing','Hi {name}, how was order {order_number}? Drop a quick review: {url}','["name","order_number","url"]'::jsonb),
('winback_30d','Winback','marketing','{name}, we miss you. Here''s {discount} off your next order: code {code}','["name","discount","code"]'::jsonb),
('birthday_offer','Birthday Offer','marketing','Happy birthday {name}! Enjoy {discount} off today with code {code}.','["name","discount","code"]'::jsonb),
('membership_welcome','Membership Welcome','marketing','Welcome to POSHPLEX {tier}, {name}. Your perks: {url}','["name","tier","url"]'::jsonb),
('story_reply_followup','Story Reply Follow-up','marketing','Hi {name}, thanks for replying to our story! Here''s the link: {url}','["name","url"]'::jsonb),
('comment_reply_dm','Comment Reply DM','marketing','Hi {name}, thanks for the comment! Details here: {url}','["name","url"]'::jsonb);

-- =========== MESSENGER ===========
CREATE TABLE public.msgr_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL DEFAULT '',
  endpoint_url TEXT NOT NULL DEFAULT '',
  http_method TEXT NOT NULL DEFAULT 'POST',
  request_template JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  access_token TEXT NOT NULL DEFAULT '',
  page_id TEXT NOT NULL DEFAULT '',
  messaging_type TEXT NOT NULL DEFAULT 'MESSAGE_TAG',
  message_tag TEXT NOT NULL DEFAULT 'POST_PURCHASE_UPDATE',
  sender_display_name TEXT NOT NULL DEFAULT 'POSHPLEX',
  success_keyword TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_provider_settings TO authenticated;
GRANT ALL ON public.msgr_provider_settings TO service_role;
ALTER TABLE public.msgr_provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr provider" ON public.msgr_provider_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_msgr_provider_updated BEFORE UPDATE ON public.msgr_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.msgr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'marketing',
  media_url TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_templates TO authenticated;
GRANT ALL ON public.msgr_templates TO service_role;
ALTER TABLE public.msgr_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr templates" ON public.msgr_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_msgr_templates_updated BEFORE UPDATE ON public.msgr_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.msgr_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psid TEXT NOT NULL UNIQUE,
  page_id TEXT,
  name TEXT,
  opted_in BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_subscribers TO authenticated;
GRANT ALL ON public.msgr_subscribers TO service_role;
ALTER TABLE public.msgr_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr subscribers" ON public.msgr_subscribers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_msgr_subscribers_updated BEFORE UPDATE ON public.msgr_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.msgr_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.msgr_templates(id) ON DELETE SET NULL,
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_campaigns TO authenticated;
GRANT ALL ON public.msgr_campaigns TO service_role;
ALTER TABLE public.msgr_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr campaigns" ON public.msgr_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_msgr_campaigns_updated BEFORE UPDATE ON public.msgr_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.msgr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.msgr_campaigns(id) ON DELETE SET NULL,
  to_psid TEXT NOT NULL,
  template_key TEXT,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_message_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_msgr_messages_campaign ON public.msgr_messages(campaign_id);
CREATE INDEX idx_msgr_messages_created ON public.msgr_messages(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_messages TO authenticated;
GRANT ALL ON public.msgr_messages TO service_role;
ALTER TABLE public.msgr_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr messages" ON public.msgr_messages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.msgr_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psid TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL DEFAULT 'unsubscribe',
  source TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.msgr_suppression TO authenticated;
GRANT INSERT ON public.msgr_suppression TO anon;
GRANT ALL ON public.msgr_suppression TO service_role;
ALTER TABLE public.msgr_suppression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage msgr suppression" ON public.msgr_suppression FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can opt out msgr" ON public.msgr_suppression FOR INSERT TO anon WITH CHECK (true);

-- Seed Messenger provider + templates
INSERT INTO public.msgr_provider_settings (provider_name, endpoint_url, http_method, headers, request_template)
VALUES (
  'Meta Graph API (Messenger)',
  'https://graph.facebook.com/v20.0/me/messages?access_token={access_token}',
  'POST',
  '{"Content-Type":"application/json"}'::jsonb,
  '{"recipient":{"id":"{to}"},"messaging_type":"{messaging_type}","tag":"{message_tag}","message":{"text":"{body}"}}'::jsonb
);

INSERT INTO public.msgr_templates (event_key, name, category, body, variables) VALUES
('new_drop_announcement','New Drop','marketing','New drop just landed at POSHPLEX. Be first: {url}','["url"]'::jsonb),
('flash_sale','Flash Sale','marketing','Flash sale at POSHPLEX — {discount} off for {hours}h. Shop: {url}','["discount","hours","url"]'::jsonb),
('lookbook_share','Lookbook','marketing','{name}, our latest lookbook is live: {url}','["name","url"]'::jsonb),
('back_in_stock','Back In Stock','marketing','{name}, {product} is back in stock. Grab it: {url}','["name","product","url"]'::jsonb),
('price_drop','Price Drop','marketing','Hey {name}, the price just dropped on {product}: {url}','["name","product","url"]'::jsonb),
('order_shipped','Order Shipped','transactional','Good news {name}! Order {order_number} is on the way. Track: {tracking}','["name","order_number","tracking"]'::jsonb),
('order_delivered','Order Delivered','transactional','Hi {name}, your POSHPLEX order {order_number} has been delivered. Enjoy!','["name","order_number"]'::jsonb),
('review_request','Review Request','marketing','Hi {name}, how was order {order_number}? Drop a quick review: {url}','["name","order_number","url"]'::jsonb),
('winback_30d','Winback','marketing','{name}, we miss you. Here''s {discount} off your next order: code {code}','["name","discount","code"]'::jsonb),
('birthday_offer','Birthday Offer','marketing','Happy birthday {name}! Enjoy {discount} off today with code {code}.','["name","discount","code"]'::jsonb),
('membership_welcome','Membership Welcome','marketing','Welcome to POSHPLEX {tier}, {name}. Your perks: {url}','["name","tier","url"]'::jsonb);
