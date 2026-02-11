
-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to profile images
CREATE POLICY "Public can view profile images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload profile images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own profile images
CREATE POLICY "Users can update profile images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete their own profile images
CREATE POLICY "Users can delete profile images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid() IS NOT NULL);
