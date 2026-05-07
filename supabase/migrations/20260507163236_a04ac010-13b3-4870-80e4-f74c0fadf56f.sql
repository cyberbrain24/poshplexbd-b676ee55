
INSERT INTO public.music_tracks (title, file_url, file_path, sort_order, is_active)
SELECT 'Sample Track', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'external/soundhelix-1.mp3', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.music_tracks);
