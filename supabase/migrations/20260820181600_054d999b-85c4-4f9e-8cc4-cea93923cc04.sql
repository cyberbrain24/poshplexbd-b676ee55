UPDATE public.site_settings
SET meta_pixel_enabled = false,
    meta_capi_enabled = false,
    meta_ecommerce_events_enabled = false,
    updated_at = now()
WHERE id = 'f03622c7-9b3a-43c2-8279-8aaa4782e983';