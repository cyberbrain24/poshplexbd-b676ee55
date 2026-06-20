// Admin-only one-time backfill: converts every non-WebP image in public storage
// to WebP, rewrites DB rows that reference the old URL, and deletes originals.
// Runs one browser-safe image per request so the function avoids CPU timeouts.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BUCKETS = ["product-images", "media", "review-images", "profile-images"] as const;
const MAX_BATCH = 1;
const DEFAULT_BATCH = 1;
const IMAGE_EXT = new Set([
  "jpg", "jpeg", "jpe", "jfif", "png", "gif", "bmp", "dib",
  "tif", "tiff", "heic", "heif", "avif", "ico", "tga", "ppm",
  "pgm", "pbm", "pnm",
]);

interface BodyParams {
  batch_size?: number;
  image_data?: string;
  source?: { bucket: string; path: string; size?: number };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function publicUrl(supabase: ReturnType<typeof createClient>, bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma === -1 || !dataUrl.startsWith("data:image/webp")) {
    throw new Error("Invalid WebP image payload");
  }
  const base64 = dataUrl.slice(comma + 1);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
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
      const isFolder = !entry.id;
      const childPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isFolder) {
        await findPending(admin, bucket, childPath, needed, out);
        continue;
      }
      const ext = extOf(entry.name);
      if (ext === "webp") continue;
      if (!IMAGE_EXT.has(ext)) continue;
      const { data: lastError } = await admin
        .from("image_migration_log")
        .select("error")
        .eq("bucket", bucket)
        .eq("old_path", childPath)
        .eq("status", "error")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastError?.error && !String(lastError.error).includes("CPU Time exceeded")) continue;
      out.push({ bucket, path: childPath, size: entry.metadata?.size ?? 0 });
    }
    if (data.length < 100) break;
    offset += data.length;
  }
}

async function rewriteReferences(
  admin: ReturnType<typeof createClient>,
  oldUrl: string,
  newUrl: string,
) {
  const safe = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.warn(`[rewrite] ${label} failed:`, (e as Error).message);
    }
  };

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

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return { error: json({ error: "Unauthorized" }, 401) };
  const { data: roleData } = await userClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) return { error: json({ error: "Admin only" }, 403) };

  return { admin: createClient(supabaseUrl, serviceKey) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;
    const admin = auth.admin!;

    let body: BodyParams = {};
    try {
      body = await req.json();
    } catch {
      // empty body ok
    }

    if (body.image_data && body.source) {
      const source = body.source;
      if (!BUCKETS.includes(source.bucket as typeof BUCKETS[number])) {
        return json({ error: "Unsupported bucket" }, 400);
      }
      if (extOf(source.path) === "webp" || !IMAGE_EXT.has(extOf(source.path))) {
        return json({ processed: 0, deleted: 0, errors: [], more: true });
      }

      const oldUrl = publicUrl(admin, source.bucket, source.path);
      const newPath = source.path.replace(/\.[^.]+$/, "") + ".webp";
      const newUrl = publicUrl(admin, source.bucket, newPath);
      const errors: Array<{ path: string; error: string }> = [];

      try {
        const webpBytes = dataUrlToBytes(body.image_data);
        const up = await admin.storage
          .from(source.bucket)
          .upload(newPath, webpBytes, { contentType: "image/webp", upsert: true });
        if (up.error) throw up.error;

        await rewriteReferences(admin, oldUrl, newUrl);

        const rm = await admin.storage.from(source.bucket).remove([source.path]);
        if (rm.error) throw rm.error;

        await admin.from("image_migration_log").insert({
          bucket: source.bucket,
          old_path: source.path,
          new_path: newPath,
          old_size: source.size ?? null,
          new_size: webpBytes.byteLength,
          status: "ok",
        });
        return json({ processed: 1, deleted: 1, errors, more: true, batch_size: 1 });
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        errors.push({ path: `${source.bucket}/${source.path}`, error: msg });
        await admin.from("image_migration_log").insert({
          bucket: source.bucket,
          old_path: source.path,
          new_path: newPath,
          old_size: source.size ?? null,
          new_size: null,
          status: "error",
          error: msg,
        });
        return json({ processed: 0, deleted: 0, errors, more: true, batch_size: 1 });
      }
    }

    const batchSize = Math.min(MAX_BATCH, Math.max(1, body.batch_size ?? DEFAULT_BATCH));
    const pending: Array<{ bucket: string; path: string; size: number }> = [];
    for (const bucket of BUCKETS) {
      if (pending.length >= batchSize) break;
      await findPending(admin, bucket, "", batchSize, pending);
    }

    return json({
      processed: 0,
      deleted: 0,
      errors: [],
      more: pending.length > 0,
      pending: pending.slice(0, batchSize),
      batch_size: batchSize,
    });
  } catch (e) {
    console.error("convert-storage-to-webp error", e);
    return json({ processed: 0, deleted: 0, errors: [{ path: "system", error: (e as Error).message }], more: false });
  }
});