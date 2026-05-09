
-- Extend chatbot_conversations to track channel
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS external_user_id text;

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_channel_user
  ON public.chatbot_conversations(channel, external_user_id);

-- Meta channel credentials
CREATE TABLE IF NOT EXISTS public.meta_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('whatsapp','messenger','instagram')),
  display_name text NOT NULL,
  page_id text,
  phone_number_id text,
  business_account_id text,
  app_id text,
  app_secret text,
  access_token text,
  verify_token text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage meta_channels"
  ON public.meta_channels FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_meta_channels_updated
  BEFORE UPDATE ON public.meta_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meta user → conversation mapping
CREATE TABLE IF NOT EXISTS public.meta_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_channel_id uuid NOT NULL REFERENCES public.meta_channels(id) ON DELETE CASCADE,
  channel text NOT NULL,
  external_user_id text NOT NULL,
  conversation_id uuid REFERENCES public.chatbot_conversations(id) ON DELETE SET NULL,
  customer_id uuid,
  display_name text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meta_channel_id, external_user_id)
);

ALTER TABLE public.meta_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view meta_conversations"
  ON public.meta_conversations FOR SELECT USING (is_admin());

CREATE TRIGGER trg_meta_conversations_updated
  BEFORE UPDATE ON public.meta_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
