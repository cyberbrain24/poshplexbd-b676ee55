
-- Add Meta Pixel columns to site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS meta_pixel_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meta_pixel_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_ecommerce_events_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_capi_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS meta_capi_access_token text DEFAULT NULL;

-- Create lightweight tracking_events table for event monitor
CREATE TABLE public.tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Admin can manage tracking events
CREATE POLICY "Admins can manage tracking_events"
  ON public.tracking_events FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Anyone can insert tracking events (fired from storefront)
CREATE POLICY "Public can insert tracking_events"
  ON public.tracking_events FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup: keep only last 500 rows via trigger
CREATE OR REPLACE FUNCTION public.cleanup_tracking_events()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.tracking_events
  WHERE id NOT IN (
    SELECT id FROM public.tracking_events
    ORDER BY created_at DESC
    LIMIT 500
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cleanup_tracking_events
  AFTER INSERT ON public.tracking_events
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_tracking_events();

-- Create index for fast recent-event queries
CREATE INDEX idx_tracking_events_created_at ON public.tracking_events (created_at DESC);
