
-- email_provider_settings
CREATE TABLE public.email_provider_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT DEFAULT '',
  endpoint_url TEXT DEFAULT '',
  http_method TEXT DEFAULT 'POST',
  headers JSONB DEFAULT '{"Content-Type":"application/json"}'::jsonb,
  request_template JSONB DEFAULT '{}'::jsonb,
  api_key TEXT DEFAULT '',
  from_email TEXT DEFAULT '',
  from_name TEXT DEFAULT '',
  reply_to TEXT DEFAULT '',
  success_keyword TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_provider_settings TO authenticated;
GRANT ALL ON public.email_provider_settings TO service_role;
ALTER TABLE public.email_provider_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage email provider" ON public.email_provider_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.email_provider_settings (provider_name, endpoint_url, http_method, headers, request_template)
VALUES (
  '',
  '',
  'POST',
  '{"Content-Type":"application/json","Authorization":"Bearer {api_key}"}'::jsonb,
  '{"from":{"email":"{from_email}","name":"{from_name}"},"to":[{"email":"{to}"}],"subject":"{subject}","html":"{html}"}'::jsonb
);

-- email_templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  html TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  is_system BOOLEAN NOT NULL DEFAULT true,
  placeholders TEXT DEFAULT '{name}, {email}, {order_number}, {total}, {tracking}, {product}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage email templates" ON public.email_templates
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.email_templates (event_key, name, subject, html) VALUES
('order_placed', 'Order Placed', 'Your POSHPLEX order {order_number} is confirmed', '<p>Hi {name},</p><p>Thanks for your order <b>{order_number}</b>. Total: ৳{total}.</p><p>BE POSH WITH POSHPLEX.</p>'),
('order_shipped', 'Order Shipped', 'Your order {order_number} is on the way', '<p>Hi {name},</p><p>Your order <b>{order_number}</b> has shipped. Tracking: {tracking}.</p>'),
('order_delivered', 'Order Delivered', 'Your order {order_number} was delivered', '<p>Hi {name},</p><p>Your order <b>{order_number}</b> has been delivered. Enjoy!</p>'),
('account_welcome', 'Welcome', 'Welcome to POSHPLEX', '<p>Hi {name},</p><p>Welcome to POSHPLEX. Be posh.</p>'),
('review_request', 'Review Request', 'How was your POSHPLEX order?', '<p>Hi {name},</p><p>We''d love your review on your recent purchase.</p>'),
('cart_abandoned', 'Cart Abandoned', 'You left something behind', '<p>Hi {name},</p><p>Your cart is waiting. Complete your order today.</p>'),
('back_in_stock', 'Back In Stock', '{product} is back in stock', '<p>Hi {name},</p><p><b>{product}</b> is back. Get it before it''s gone.</p>'),
('winback', 'We Miss You', 'A little something to bring you back', '<p>Hi {name},</p><p>It''s been a while. Here''s 10% off your next order.</p>'),
('birthday', 'Happy Birthday', 'Happy birthday from POSHPLEX', '<p>Happy birthday, {name}! Enjoy a special offer on us.</p>');

-- email_campaigns
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  audience_filter JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_campaigns TO service_role;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage email campaigns" ON public.email_campaigns
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- email_messages
CREATE TABLE public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  trigger_event TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_messages TO authenticated;
GRANT ALL ON public.email_messages TO service_role;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage email messages" ON public.email_messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- email_suppression
CREATE TABLE public.email_suppression (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  reason TEXT DEFAULT 'unsubscribe',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_suppression TO authenticated;
GRANT INSERT ON public.email_suppression TO anon;
GRANT ALL ON public.email_suppression TO service_role;
ALTER TABLE public.email_suppression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage suppression" ON public.email_suppression
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "anyone can unsubscribe" ON public.email_suppression
  FOR INSERT TO anon WITH CHECK (true);

-- updated_at triggers
CREATE TRIGGER trg_email_provider_updated BEFORE UPDATE ON public.email_provider_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
