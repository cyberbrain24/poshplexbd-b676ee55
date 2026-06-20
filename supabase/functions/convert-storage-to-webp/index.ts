// Admin-only one-time backfill: converts every non-WebP image in storage
// to WebP under 250 KB, rewrites every DB row that references the old URL,
// and deletes the original file. Designed to be polled in small batches
// from the admin UI until `remaining === 0`.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  ImageMagick,
  initialize as initImageMagick,
  MagickFormat,
} from "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts";

const BUCKETS = ["product-images", "media", "review-images", "profile-images"] as const;
const MAX_BATCH = 20;
const DEFAULT_BATCH = 5;
const WEBP_QUALITY = 85; // high-quality re-encode; no size/pixel cap on existing images
const SKIP_EXT = new Set(["webp", "gif", "svg"]); // pass-through formats
const RASTER_EXT = new Set(["jpg", "jpeg", "png", "bmp", "tif", "tiff", "heic", "heif", "avif"]);

interface BodyParams {
  batch_size?: number;
}

let magickReady: Promise<void> | null = null;
function ensureMagick() {
  if (!magickReady) magickReady = initImageMagick();
  return magickReady;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function publicUrl(supabase: ReturnType<typeof createClient>, bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function findPending(
  admin: ReturnType<typeof createClient>,
  bucket: string,
  prefix: string,
  needed: number,
  out: Array<{ bucket: string; path: string; size: number }>,
) {
  if (out.length >= needed) return;
  let offset = 0;
  while (out.length < needed) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error || !data || data.length === 0) break;
    for (const entry of data) {
      if (out.length >= needed) return;
      // Folder entries have id === null
      const isFolder = !entry.id;
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isFolder) {
        await findPending(admin, bucket, childPath, needed, out);
        continue;
      }
      const ext = extOf(entry.name);
      if (SKIP_EXT.has(ext)) continue;
      if (!RASTER_EXT.has(ext)) continue; // unknown — skip
      out.push({ bucket, path: childPath, size: entry.metadata?.size ?? 0 });
    }
    if (data.length < 100) break;
    offset += data.length;
  }
}

async function encodeWebpUnder250(bytes: Uint8Array): Promise<Uint8Array> {
  await ensureMagick();
  const edges = [2000, 1600, 1280, 1024, 800];
  const qualities = [85, 78, 70, 60, 50];
  let smallest: Uint8Array | null = null;

  for (const edge of edges) {
    for (const q of qualities) {
      const out = await new Promise<Uint8Array>((resolve, reject) => {
        try {
          ImageMagick.read(bytes, (img) => {
            const longest = Math.max(img.width, img.height);
            if (longest > edge) {
              const scale = edge / longest;
              img.resize(Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
            }
            img.quality = q;
            img.write(MagickFormat.Webp, (data) => resolve(new Uint8Array(data)));
          });
        } catch (e) {
          reject(e);
        }
      });
      if (!smallest || out.byteLength < smallest.byteLength) smallest = out;
      if (out.byteLength <= TARGET_BYTES) return out;
    }
  }
  if (!smallest) throw new Error("WebP encode produced no output");
  return smallest;
}

async function rewriteReferences(
  admin: ReturnType<typeof createClient>,
  oldUrl: string,
  newUrl: string,
) {
  // Helper to swallow per-table errors so one failure doesn't kill the batch.
  const safe = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.warn(`[rewrite] ${label} failed:`, (e as Error).message);
    }
  };

  // Plain text columns: simple eq update (URL is unique enough)
  const textTargets: Array<{ table: string; col: string }> = [
    { table: "categories", col: "image_url" },
    { table: "customers", col: "profile_image_url" },
    { table: "orders", col: "payment_proof_url" },
    { table: "product_images", col: "image_url" },
    { table: "product_images", col: "thumb_url" },
    { table: "product_images", col: "medium_url" },
    { table: "product_variants", col: "image_url" },
    { table: "promotions", col: "image_url" },
    { table: "seo_pages", col: "og_image_url" },
    { table: "shared_variants", col: "image_url" },
    { table: "site_branding", col: "logo_url" },
    { table: "site_branding", col: "desktop_hero_url" },
    { table: "site_branding", col: "mobile_hero_url" },
    { table: "blog_posts", col: "cover_image_url" },
    { table: "blog_posts", col: "og_image_url" },
  ];
  for (const t of textTargets) {
    await safe(`${t.table}.${t.col}`, () =>
      admin.from(t.table).update({ [t.col]: newUrl }).eq(t.col, oldUrl),
    );
  }

  // blog_posts.content (may contain inline <img src=...>)
  await safe("blog_posts.content", async () => {
    const { data } = await admin
      .from("blog_posts")
      .select("id, content")
      .ilike("content", `%${oldUrl}%`);
    for (const row of data ?? []) {
      const next = (row.content as string).split(oldUrl).join(newUrl);
      await admin.from("blog_posts").update({ content: next }).eq("id", row.id);
    }
  });

  // reviews.images — text[] array
  await safe("reviews.images", async () => {
    const { data } = await admin
      .from("reviews")
      .select("id, images")
      .contains("images", [oldUrl]);
    for (const row of data ?? []) {
      const arr = (row.images as string[]).map((u) => (u === oldUrl ? newUrl : u));
      await admin.from("reviews").update({ images: arr }).eq("id", row.id);
    }
  });

  // return_requests.proof_images — jsonb (array of strings or objects)
  await safe("return_requests.proof_images", async () => {
    const { data } = await admin
      .from("return_requests")
      .select("id, proof_images")
      .filter("proof_images::text", "ilike", `%${oldUrl}%`);
    for (const row of data ?? []) {
      const replaced = JSON.parse(JSON.stringify(row.proof_images).split(oldUrl).join(newUrl));
      await admin.from("return_requests").update({ proof_images: replaced }).eq("id", row.id);
    }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleData } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    let body: BodyParams = {};
    try {
      body = await req.json();
    } catch {
      // empty body ok
    }
    const batchSize = Math.min(MAX_BATCH, Math.max(1, body.batch_size ?? DEFAULT_BATCH));

    // 1. Collect first `batchSize` pending files across all buckets (in order)
    const pending: Array<{ bucket: string; path: string; size: number }> = [];
    for (const bucket of BUCKETS) {
      if (pending.length >= batchSize) break;
      await findPending(admin, bucket, "", batchSize, pending);
    }

    let processed = 0;
    let deleted = 0;
    const errors: Array<{ path: string; error: string }> = [];

    for (const item of pending.slice(0, batchSize)) {
      const oldUrl = publicUrl(admin, item.bucket, item.path);
      const newPath = item.path.replace(/\.[^.]+$/, "") + ".webp";
      const newUrl = publicUrl(admin, item.bucket, newPath);

      try {
        // Download original
        const dl = await admin.storage.from(item.bucket).download(item.path);
        if (dl.error || !dl.data) throw new Error(dl.error?.message ?? "download failed");
        const origBytes = new Uint8Array(await dl.data.arrayBuffer());

        // Encode to WebP under cap
        const webpBytes = await encodeWebpUnder250(origBytes);

        // Upload new file (different path because extension changes)
        const up = await admin.storage
          .from(item.bucket)
          .upload(newPath, webpBytes, { contentType: "image/webp", upsert: true });
        if (up.error) throw up.error;

        // Rewrite DB references
        await rewriteReferences(admin, oldUrl, newUrl);

        // Delete the original (only after upload + DB rewrite succeed)
        const rm = await admin.storage.from(item.bucket).remove([item.path]);
        if (rm.error) throw rm.error;
        deleted++;

        await admin.from("image_migration_log").insert({
          bucket: item.bucket,
          old_path: item.path,
          new_path: newPath,
          old_size: origBytes.byteLength,
          new_size: webpBytes.byteLength,
          status: "ok",
        });
        processed++;
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        errors.push({ path: `${item.bucket}/${item.path}`, error: msg });
        await admin.from("image_migration_log").insert({
          bucket: item.bucket,
          old_path: item.path,
          new_path: newPath,
          old_size: item.size,
          new_size: null,
          status: "error",
          error: msg,
        });
      }
    }

    // Estimate remaining: re-scan a single page per bucket, just for the count cap
    const remainingProbe: Array<{ bucket: string; path: string; size: number }> = [];
    for (const bucket of BUCKETS) {
      if (remainingProbe.length >= 1) break;
      await findPending(admin, bucket, "", 1, remainingProbe);
    }
    const moreAvailable = remainingProbe.length > 0;

    return new Response(
      JSON.stringify({
        processed,
        deleted,
        errors,
        more: moreAvailable,
        batch_size: batchSize,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("convert-storage-to-webp error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
