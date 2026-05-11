-- Knowledge / behavior rules learned by the bot
CREATE TABLE IF NOT EXISTS public.chatbot_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('rule','style','insight')),
  content text NOT NULL,
  source jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_learnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_learnings"
  ON public.chatbot_learnings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Public can view active chatbot_learnings"
  ON public.chatbot_learnings FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE TRIGGER chatbot_learnings_updated_at
  BEFORE UPDATE ON public.chatbot_learnings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit log of learning runs
CREATE TABLE IF NOT EXISTS public.chatbot_learning_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed')),
  conversations_analyzed integer NOT NULL DEFAULT 0,
  learnings_added integer NOT NULL DEFAULT 0,
  faqs_added integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  triggered_by uuid
);

ALTER TABLE public.chatbot_learning_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chatbot_learning_runs"
  ON public.chatbot_learning_runs FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Tag auto-generated FAQs separately so admins can tell them apart
ALTER TABLE public.chatbot_faqs
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source text;

CREATE INDEX IF NOT EXISTS idx_chatbot_learnings_active ON public.chatbot_learnings(is_active);
CREATE INDEX IF NOT EXISTS idx_chatbot_learning_runs_started ON public.chatbot_learning_runs(started_at DESC);