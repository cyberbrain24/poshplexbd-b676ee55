## Generate true smaller thumbnails for grid images (and backfill existing)

Goal: category and subcategory grids load a lightweight 400 px WebP thumbnail (~30–80 KB) instead of the original 500 KB+ JPEG. Product detail page keeps using a larger image, zoom keeps the original. Existing uploaded images are reprocessed in the background.

### Schema

Migration: add two nullable columns to `product_images` so we can store the resized variant URLs alongside the original.

- `thumb_url TEXT` — 400 px wide, WebP q=72
- `medium_url TEXT` — 800 px wide, WebP q=78
- `image_url` (existing) stays the original — used for zoom and as fallback.

No RLS changes; existing policies cover the new columns.

### Upload pipeline (new uploads)

`src/hooks/useProducts.ts → uploadProductImage`:

1. Upload the original as today.
2. Client-side, build two resized WebP blobs with a `<canvas>` (no extra deps): 400 px and 800 px on the long edge, preserving aspect.
3. Upload both to the same `product-images` bucket under `<productId>/thumbs/<ts>-400.webp` and `<productId>/medium/<ts>-800.webp`.
4. Return `{ url, thumb_url, medium_url }`.

Update the two callers that insert into `product_images` (admin product modal media uploads and bulk image attach) so the new columns get populated.

### Display

`src/components/ui/responsive-image.tsx`:

- Add optional `thumbUrl?: string` and `mediumUrl?: string` props.
- Per preset, pick the smallest available variant:
  - `grid` → `thumbUrl ?? mediumUrl ?? src`
  - `detail` → `mediumUrl ?? src`
  - `zoom` → `src`
- Keep the existing `srcSet`/`sizes` behaviour for the picked URL.

`src/components/category/ProductGrid.tsx` — pass `thumbUrl` and `mediumUrl` from `product.images` into `ResponsiveImage`. Same change in any other list view that already uses `preset="grid"` (Home featured / category gallery components).

### Hook query update

`useOptimizedCategoryProducts` (and `useOptimizedProducts`'s list select) — extend the `images:product_images(...)` projection to include `thumb_url, is_main` and `medium_url`. Tiny payload increase, big bandwidth win on the actual `<img>` request.

### Backfill (existing images)

Edge function `regenerate-image-thumbnails`:

- Admin-only (verifies Bearer token + `admin` role like the existing pattern).
- Accepts `{ batch_size?: number, dry_run?: boolean }`. Default batch 25.
- Selects `product_images` rows where `thumb_url IS NULL OR medium_url IS NULL`, ordered by `created_at` so newest is processed first.
- For each row: fetches the original from storage, resizes with `https://deno.land/x/imagescript` (pure-WASM, no native deps), uploads `thumbs/...webp` and `medium/...webp`, then updates the row with the new URLs.
- Returns `{ processed, remaining, errors }` so the admin UI can loop until done.

Admin trigger: a small section on `/admin/media` ("Regenerate thumbnails — N images pending") with a button that polls the function in a loop and shows progress. No cron — user starts it once after deploy.

### Out of scope

- No change to RLS, buckets, review images, profile images, or media library uploads (only product images need this for now).
- No paid image transformation — variants are precomputed and stored.
- No change to the product detail page zoom/gallery layout.

### Files touched

- new migration (adds two columns)
- `src/hooks/useProducts.ts` (upload + types)
- `src/hooks/useOptimizedProducts.ts` (select)
- `src/components/ui/responsive-image.tsx` (variant picker)
- `src/components/category/ProductGrid.tsx` (pass thumb/medium urls)
- `src/components/admin/products/*ProductModal*.tsx` (insert thumb/medium into product_images)
- `src/types/product.ts` (image type fields)
- new `supabase/functions/regenerate-image-thumbnails/index.ts`
- `src/pages/admin/AdminMedia.tsx` (Regenerate button + progress)

Expected outcome on `/category/fifa-collection`: per-card image transfer drops from ~500 KB JPEG → ~50 KB WebP (≈90% smaller), and the 8-card grid stops monopolising HTTP/2 connections during the LCP window.
