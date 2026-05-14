
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'default',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_notes" ON public.admin_notes FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert admin_notes" ON public.admin_notes FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update admin_notes" ON public.admin_notes FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete admin_notes" ON public.admin_notes FOR DELETE USING (is_admin());

CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_admin_notes_pinned_updated ON public.admin_notes (is_pinned DESC, updated_at DESC);
