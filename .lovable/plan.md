## Goal

Convert every existing image already in storage (≈260 files across `product-images`, `media`, `review-images`, `profile-images`) to WebP under 250 KB, update every database row that references them, and **delete the original non-WebP files** once the replacement is verified live. The site stays online for the entire run.

New uploads are already WebP-only (done in the previous turn). The `music` bucket is audio and is excluded.

## Per-file algorithm (safe order — never breaks a live page)

For each non-WebP object:

1. Skip if filename already ends in `.webp`.
2. Skip animated GIF and SVG (kept as-is — pass-through, documented carve-out).
3. Download bytes via service role.
4. Decode with `imagescript` (already used by `regenerate-image-thumbnails`).
5. Progressive resize (longest edge 2000 → 1600 → 1280 → 1024 → 800) and quality stepping (0.85 → 0.5) until encoded WebP ≤ 250 KB. WebP encode via `@jsquash/webp` WASM (works in Deno edge runtime). If even 800 px @ q=0.5 won't fit (extremely rare), keep the smallest WebP produced — never leave a non-WebP behind.
6. Upload new file at the same in-bucket path with `.webp` extension, `contentType: image/webp`, `upsert: true`.
7. Update every DB row that contains the old public URL to point to the new one (see "DB rewrites" below). All wrapped — single failure aborts that file only and leaves the original in place.
8. **Delete the original object** from storage.
9. Log `{ bucket, old_path, new_path, old_size, new_size, ok/error }` to a new `image_migration_log` table for audit / re-run visibility.

The order matters: upload → DB rewrite → delete. If any step fails, the original file stays live and the page still works. Nothing is destroyed before its replacement is referenced.

## DB rewrites (every place a URL is stored)

The function discovers columns at runtime via `information_schema.columns` so adding/removing a URL column later doesn't require a code change. For each file it runs targeted `update ... set col = replace(col, old_url, new_url) where col like '%old_url%'` on:

- `products.image_url`
- `product_images.image_url`, `thumb_url`, `medium_url`
- `categories.image_url`, `brands.image_url`, `materials.image_url`, `colors.image_url`, `sizes.image_url`, `care_instructions.image_url` (where present)
- `customers.profile_image_url`
- `reviews.image_urls` (text[]/jsonb — handled with array map / jsonb cast)
- `promotions.image_url`
- `site_branding.logo_url`, `favicon_url`, `desktop_hero_url`, `mobile_hero_url`
- `seo_pages.og_image` and any text content blob via `replace()`
- `media_metadata` if it stores URLs
- `blog_posts.cover_image_url`, `content` (long text — `replace()` covers inline `<img src=...>`)

## Edge Function: `convert-storage-to-webp`

Admin-only, batched, resumable:

- Auth: same JWT + user_roles admin check pattern as `regenerate-image-thumbnails`.
- Body: `{ batch_size?: number (default 5, max 20), bucket?: string }`.
- Returns: `{ processed, deleted, remaining, errors[], totals_by_bucket }`.
- Resumable: "pending" = "object whose name doesn't end in `.webp` and isn't GIF/SVG". The function picks up wherever it left off — closing the admin tab is safe.
- Batch size 5 keeps each invocation under the edge CPU budget.

## Admin UI

New card on **Admin → Site Settings**, next to the existing "Regenerate thumbnails" button: **"Convert all images to WebP"**.

- Stats: `Total images: N · Already WebP: A · Pending: P · Converted this run: K · Deleted originals: K`.
- "Start" button polls the function in batches every ~2 s until `pending === 0`.
- Progress bar + last 10 errors inline.
- Stop / Resume buttons; safe to close the tab and resume later.

## Migration

```sql
create table public.image_migration_log (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  old_path text not null,
  new_path text not null,
  old_size bigint,
  new_size bigint,
  status text not null,          -- 'ok' | 'error'
  error text,
  created_at timestamptz not null default now()
);
grant select, insert on public.image_migration_log to authenticated;
grant all on public.image_migration_log to service_role;
alter table public.image_migration_log enable row level security;
create policy "Admins manage image migration log"
  on public.image_migration_log for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
```

## Files to add / change

**New:**
- `supabase/functions/convert-storage-to-webp/index.ts`
- `src/components/admin/ConvertImagesToWebpCard.tsx`
- One migration for `image_migration_log`.

**Edited:**
- `src/pages/admin/AdminSiteSettings.tsx` — mount the new card.

## Out of scope

- The `music` bucket (audio).
- Re-running thumb/medium generation — `regenerate-image-thumbnails` already does that and will see the new `.webp` originals correctly.
- Any client-side upload changes (already WebP-only).

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Old URL still cached on Cloudflare after delete | Original is removed only after upload + DB rewrite succeed; first request to the new URL hydrates cache. Worst case: brief 404 on a stale cached page until refresh. |
| WebP WASM init fails in edge runtime | Function aborts that batch with a clear error rather than writing a non-WebP — admin sees it and we troubleshoot. No silent fallback that violates the "WebP-only" requirement. |
| A column we forgot stores a URL | `information_schema` discovery + audit log makes orphans visible; we can run a one-shot "verify" query that searches every text column for any remaining old-format URL. |
| Long-running run timing out | Small batches, idempotent. Admin re-clicks "Start" to resume; per-file writes are sequential and safe to retry. |
| Reviews `image_urls` is an array | Handled explicitly with array unnest+map update path, not a naive `replace()` on the whole column. |

Approve and I'll implement it.
