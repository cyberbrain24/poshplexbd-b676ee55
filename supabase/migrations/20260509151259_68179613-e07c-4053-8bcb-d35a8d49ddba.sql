
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_content_trgm
  ON public.chatbot_messages USING gin (content gin_trgm_ops);
