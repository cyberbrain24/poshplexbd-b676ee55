-- Create media storage bucket for general uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload files to media bucket
CREATE POLICY "Admins can upload to media bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_admin());

-- Allow admins to update files in media bucket
CREATE POLICY "Admins can update media bucket files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin());

-- Allow admins to delete files from media bucket
CREATE POLICY "Admins can delete from media bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND public.is_admin());

-- Allow public to view media files
CREATE POLICY "Public can view media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');