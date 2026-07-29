UPDATE storage.objects
SET metadata = jsonb_set(coalesce(metadata,'{}'::jsonb), '{cacheControl}', '"max-age=31536000"')
WHERE bucket_id IN ('product-images','review-images','profile-images','media')
  AND coalesce(metadata->>'cacheControl','') <> 'max-age=31536000';