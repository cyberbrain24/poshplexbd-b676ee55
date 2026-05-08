-- Settings (single row)
CREATE TABLE public.chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  system_prompt text NOT NULL DEFAULT 'You are POSHPLEX''s shopping assistant. Help customers find products, answer questions about their orders, and place new orders. Only discuss products, orders, shipping, returns, and customer account topics. Politely refuse anything else.',
  welcome_message text NOT NULL DEFAULT 'Hi! I''m your POSHPLEX shopping assistant. Ask me about products, your orders, or place a new order.',
  blocked_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view chatbot settings" ON public.chatbot_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage chatbot settings" ON public.chatbot_settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER chatbot_settings_updated_at BEFORE UPDATE ON public.chatbot_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Single-row guard
CREATE OR REPLACE FUNCTION public.ensure_single_chatbot_settings()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.chatbot_settings) >= 1 THEN
    RAISE EXCEPTION 'Only one chatbot_settings row is allowed.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER chatbot_settings_single_row BEFORE INSERT ON public.chatbot_settings
  FOR EACH ROW EXECUTE FUNCTION public.ensure_single_chatbot_settings();

INSERT INTO public.chatbot_settings DEFAULT VALUES;

-- FAQs
CREATE TABLE public.chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active faqs" ON public.chatbot_faqs FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins manage faqs" ON public.chatbot_faqs FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER chatbot_faqs_updated_at BEFORE UPDATE ON public.chatbot_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversations
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  auth_user_id uuid,
  user_agent text,
  message_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chatbot_conversations_session ON public.chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_customer ON public.chatbot_conversations(customer_id);
CREATE INDEX idx_chatbot_conversations_created ON public.chatbot_conversations(created_at DESC);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create conversations" ON public.chatbot_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own conversation" ON public.chatbot_conversations FOR UPDATE USING (true);
CREATE POLICY "Admins view all conversations" ON public.chatbot_conversations FOR SELECT USING (is_admin());
CREATE POLICY "Admins delete conversations" ON public.chatbot_conversations FOR DELETE USING (is_admin());

-- Messages
CREATE TABLE public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL,
  feedback text CHECK (feedback IN ('good','bad') OR feedback IS NULL),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chatbot_messages_conv ON public.chatbot_messages(conversation_id, created_at);

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert messages" ON public.chatbot_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all messages" ON public.chatbot_messages FOR SELECT USING (is_admin());
CREATE POLICY "Admins update messages" ON public.chatbot_messages FOR UPDATE USING (is_admin());
CREATE POLICY "Admins delete messages" ON public.chatbot_messages FOR DELETE USING (is_admin());