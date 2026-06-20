## Goal

Every new image upload is auto-converted to WebP, capped at 250 KB, and stored with a `.webp` extension only. No JPEG/PNG/HEIC ever lands in storage going forward. Existing files are untouched (no destructive migration) — they keep working, and the existing `regenerate-image-thumbnails` flow already handles backfill if needed.

## Approach (no system interruption)

One shared client-side helper does the work. Every upload call site is updated to use it. Because conversion happens in the browser before `storage.upload`, there's zero backend risk, no schema change, no edge function change, no RLS change.

### 1. New helper: `src/lib/imageToWebp.ts`

```ts
toWebpUnder250(file: File, opts?: { maxEdge?: number }) → Promise<File>
```

- Accepts any `image/*` (JPG, PNG, HEIC-as-image, etc.). GIF is passed through untouched (animation would be lost) — documented exception.
- Draws to a `<canvas>`, resizes longest edge down progressively (start at 2000 px, then 1600, 1280, 1024, 800), and re-encodes as `image/webp` with quality stepping 0.85 → 0.5.
- Stops at the first variant ≤ **250 × 1024 bytes**. If even 800 px @ q=0.5 exceeds 250 KB (extremely rare), returns the smallest produced WebP — never falls back to original format.
- Renames the file: `<basename>.webp`, MIME `image/webp`.
- Pure browser API (canvas + `toBlob`), no extra dependency.

### 2. Replace existing compressors

`src/lib/imageCompress.ts`:
- `compressProductImage` → thin wrapper around `toWebpUnder250` (keeps current import paths working).
- `compressProfileImage` → same, but with a 400×400 center-crop step before WebP encode (matches today's avatar UX). 250 KB cap still applies (well under for a 400 px square).

### 3. Update every upload site

Each one runs the file through `toWebpUnder250` and uploads with `contentType: "image/webp"` and a `.webp` filename:

- `src/hooks/useProducts.ts` → `uploadProductImage` (originals + already-webp thumb/medium variants — convert original too)
- `src/services/product.service.ts` line 175 (product image upload)
- `src/services/media.service.ts` `uploadMediaFile` (admin Media library)
- `src/components/product/ReviewImageUpload.tsx` (customer review photos)
- `src/components/admin/MasterDataModal.tsx` (category/brand/etc. images)
- `src/components/admin/PromotionModal.tsx` (promo banners)
- `src/components/admin/AdminProductAI.tsx` (AI product image upload)
- `src/hooks/useSiteBranding.ts` (logo/favicon — **SVG passes through unchanged**, only raster → webp)
- `src/pages/CustomerAccount.tsx` (already compresses; switch to webp helper)

Skipped:
- `src/pages/admin/AdminMusic.tsx` — audio bucket, not images.
- `regenerate-image-thumbnails` edge function — already produces WebP, no change needed.

### 4. UI copy

Update upload helper text everywhere it shows "PNG, JPG up to 5MB" → **"PNG / JPG / WebP — auto-converted to WebP, max 250 KB after compression"**. Files larger than 5 MB are still rejected up front (same as today) so we don't load a 50 MB photo into a canvas.

## Edge cases

- **Animated GIF**: passed through as-is (one-line documented carve-out). Static GIF is converted.
- **SVG** (logo/favicon): passed through, vector — already tiny.
- **HEIC**: most browsers can decode via `<img>`; if decode fails the helper throws and the existing toast surfaces "Invalid image" — same UX as today.
- **Existing storage files**: untouched. Old `.jpg` URLs keep working. The product-image table already stores `thumb_url` / `medium_url` as WebP for new uploads.

## Out of scope

- No destructive re-encode of the 260 existing files in storage (avoids any chance of breaking live pages). If you want a one-time backfill later, the existing `regenerate-image-thumbnails` admin button is the right place.
- No RLS, no bucket changes, no migration.

## Files touched

- new `src/lib/imageToWebp.ts`
- `src/lib/imageCompress.ts` (rewritten as wrappers)
- 9 upload call sites listed above (small edits — call helper, change contentType + filename ext)
- minor copy text in `ReviewImageUpload.tsx` and any other visible upload labels
