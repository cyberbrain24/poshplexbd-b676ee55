/**
 * Utility to generate optimized image URLs from Supabase Storage.
 * Uses Supabase's built-in image transformation API to serve 
 * resized and format-converted images on the fly.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Transform a Supabase storage public URL to serve an optimized version.
 * Only works for images hosted on Supabase storage.
 * 
 * @param url - The original public URL
 * @param options - Transformation options
 * @returns Transformed URL or original if not a Supabase storage URL
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif';
  } = {}
): string {
  if (!url || !SUPABASE_URL) return url;

  // Only transform Supabase storage URLs
  if (!url.includes('/storage/v1/object/public/')) return url;

  const { width, height, quality = 75, format = 'webp' } = options;

  // Replace /object/public/ with /render/image/public/ for transformations
  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  params.set('quality', String(quality));
  params.set('format', format);
  params.set('resize', 'cover');

  return `${transformedUrl}?${params.toString()}`;
}
