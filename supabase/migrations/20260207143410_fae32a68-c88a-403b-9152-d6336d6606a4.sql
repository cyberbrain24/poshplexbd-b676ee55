-- Create a table to track seeding job progress
CREATE TABLE public.seed_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  total_products INTEGER NOT NULL DEFAULT 0,
  products_created INTEGER NOT NULL DEFAULT 0,
  variants_created INTEGER NOT NULL DEFAULT 0,
  images_created INTEGER NOT NULL DEFAULT 0,
  current_batch INTEGER NOT NULL DEFAULT 0,
  total_batches INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable realtime for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.seed_jobs;

-- Allow public read for progress tracking (no RLS needed for this utility table)
ALTER TABLE public.seed_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seed jobs" 
ON public.seed_jobs 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert seed jobs" 
ON public.seed_jobs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update seed jobs" 
ON public.seed_jobs 
FOR UPDATE 
USING (true);