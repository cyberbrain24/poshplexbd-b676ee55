
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS tag text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS guest_number integer,
  ADD COLUMN IF NOT EXISTS display_name text;

CREATE SEQUENCE IF NOT EXISTS public.chatbot_guest_number_seq;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT id FROM public.chatbot_conversations
    WHERE guest_number IS NULL
      AND customer_id IS NULL
      AND (external_user_id IS NULL OR external_user_id = '')
    ORDER BY created_at
  LOOP
    UPDATE public.chatbot_conversations
      SET guest_number = nextval('public.chatbot_guest_number_seq')
      WHERE id = r.id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.assign_chatbot_guest_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.guest_number IS NULL
     AND NEW.customer_id IS NULL
     AND (NEW.external_user_id IS NULL OR NEW.external_user_id = '') THEN
    NEW.guest_number := nextval('public.chatbot_guest_number_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_chatbot_guest_number ON public.chatbot_conversations;
CREATE TRIGGER trg_assign_chatbot_guest_number
BEFORE INSERT ON public.chatbot_conversations
FOR EACH ROW EXECUTE FUNCTION public.assign_chatbot_guest_number();

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_tag ON public.chatbot_conversations(tag);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_channel ON public.chatbot_conversations(channel);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_last_message_at ON public.chatbot_conversations(last_message_at DESC);
