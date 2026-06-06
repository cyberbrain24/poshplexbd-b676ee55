Upgrade the Photos field in the admin "Create Review" dialog (and the existing customer review uploader) so admins can either click to browse their computer or drag-and-drop image files directly from any folder.

## What changes

Update `src/components/product/ReviewImageUpload.tsx` (used by both `AdminCreateReviewDialog` and the customer review form, so both benefit):

1. **Click-to-upload (bigger target)**
   - Replace the small 16x16 icon tile with a wider dashed dropzone (full width of the field, ~28-32 tall) showing an upload icon, "Click to upload or drag and drop", and a hint line ("PNG, JPG up to 5MB · max N images").
   - Clicking anywhere on the dropzone opens the native OS file picker (multi-select enabled, `accept="image/*"`).

2. **Drag & drop from computer**
   - Add `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop` handlers on the dropzone.
   - On `dragover`, prevent default and show an "active" state (solid border + subtle bg using design tokens, e.g. `border-foreground bg-muted`).
   - On `drop`, read `e.dataTransfer.files`, filter to `image/*`, then run the existing upload pipeline (same validation: image-only, ≤5MB, respects `maxImages`).
   - Prevent the browser's default behaviour so dropping outside the zone doesn't navigate away (scoped listeners only on the dropzone — no global window listeners).

3. **Thumbnails row (unchanged behaviour, lightly restyled)**
   - Keep the existing uploaded thumbnails with the hover ✕ remove button, shown above the dropzone in a flex-wrap grid.
   - Hide the dropzone once `images.length >= maxImages` and show a small note "Maximum N photos reached".

4. **States**
   - Disabled / loading state shows the spinner inside the dropzone and ignores drops.
   - Toast errors stay the same (non-image, oversize, max reached).

## Files touched

- `src/components/product/ReviewImageUpload.tsx` — only file edited.
- No DB, no storage, no other component changes. `AdminCreateReviewDialog.tsx` and the customer-side review form keep using the same props (`images`, `onChange`, `maxImages`), so they pick up the new UX automatically.

## Out of scope

- No changes to the existing `review-images` storage bucket, RLS, or upload path.
- No reordering / cropping features.
