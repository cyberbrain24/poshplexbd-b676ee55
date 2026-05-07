
-- Music tracks table
CREATE TABLE public.music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active music_tracks"
ON public.music_tracks FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can insert music_tracks"
ON public.music_tracks FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update music_tracks"
ON public.music_tracks FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete music_tracks"
ON public.music_tracks FOR DELETE
USING (is_admin());

-- Storage bucket for music
INSERT INTO storage.buckets (id, name, public)
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read music files"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

CREATE POLICY "Admins can upload music files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music' AND is_admin());

CREATE POLICY "Admins can update music files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'music' AND is_admin());

CREATE POLICY "Admins can delete music files"
ON storage.objects FOR DELETE
USING (bucket_id = 'music' AND is_admin());
