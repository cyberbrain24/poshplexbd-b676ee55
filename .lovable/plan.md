## Goal

Split `/admin/media` into two pages via a tab bar at the top:

1. **All Files** — the existing media browser (unchanged).
2. **Thumbnails** (new) — a dense gallery of every image across all buckets (`product-images`, `media`, `review-images`, `profile-images`), shown as square thumbnails only, with preview / copy URL / delete actions. SEO meta edits made on a thumbnail are written to the **main image**'s `media_metadata` row so alt text / title stay in sync.

## Layout

- Tab bar at the top of `/admin/media`: `All Files` · `Thumbnails`. Same route, internal `useState` tab switch — no new route entry needed.
- Thumbnails tab content:
  - Search (filename) + bucket filter (`All / product-images / media / review-images / profile-images`).
  - Square thumbnail grid (8 cols desktop, 4 tablet, 3 mobile, `aspect-square rounded-2xl`, `object-cover`, lazy-loaded).
  - Image-only — non-image files are excluded.
  - "Load more" button after the first 60 (matches existing pattern).

## Click → action sheet

Clicking a thumbnail opens a `Dialog` with:

- Full-size preview (max 80vh, contained).
- File name, bucket, size, dimensions (read once on first preview).
- **Copy URL** button → uses existing `copyFileUrl` helper.
- **Edit SEO** → embeds the existing `MediaSeoEditor`. Save path is changed: when the file is a derived thumbnail (filename matches `…-thumb.webp` / `…-medium.webp` or sits next to a same-stem original), the editor saves under the **main image's URL key** instead of the thumbnail's, so editing a thumb updates the canonical record.
- **Delete** → reuses `useDeleteMedia` + the existing in-use guard (`useMediaReferences`); shows the same "this image is used in N places" warning before allowing delete.

## "Sync SEO meta to main image" rule

`media_metadata` is keyed by `image_url`. For a clicked file we resolve its "main image URL" with this priority:

1. If the file path ends in `-thumb.<ext>` or `-medium.<ext>`, strip that suffix → that's the main URL.
2. Else if the same stem `.webp` / `.jpg` / `.png` exists in the same folder without the suffix, use that.
3. Else the file itself is the main image — save normally.

`MediaSeoEditor` already accepts an `image_url`; we'll pass the resolved main URL. No schema change.

## Files

**New:**
- `src/components/admin/MediaThumbnailsGallery.tsx` — the new tab's view (grid + dialog).
- `src/lib/mediaThumbResolve.ts` — small helper for the main-image URL resolver.

**Edited:**
- `src/pages/admin/AdminMedia.tsx` — wrap existing content in a `Tabs` component, mount the new gallery as the second tab. Existing All Files behavior unchanged.

## Out of scope

- New routes, new sidebar entries (single Media entry stays).
- Bulk delete in the Thumbnails tab — deferred; users can use All Files for bulk ops.
- Re-running thumbnail regeneration — `regenerate-image-thumbnails` already does that.
- Music bucket (audio).

Approve and I'll implement.
