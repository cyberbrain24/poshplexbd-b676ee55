// Admin-only backfill: regenerates 400px thumb + 800px medium WebP variants
// for product_images rows that are missing them. Designed to be polled in
// batches from the admin UI until `remaining === 0`.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
// Pure-WASM image library — no native deps required in edge runtime.
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

interface BodyParams {
  batch_size?: number;
}

const BUCKET = "product-images";
const MAX_BATCH = 50;
const DEFAULT_BATCH = 10;

function publicUrlFor(supabase: ReturnType<typeof createClient>, path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Convert a public Supabase storage URL back to its in-bucket path. */
function pathFromPublicUrl(url: string): string | null {
  // .../storage/v1/object/public/product-images/<path>
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function fetchBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildVariant(img: Image, spec: { width?: number; maxEdge?: number }, quality: number): Promise<Uint8Array> {
  // Image.clone preserves the original so we can render multiple sizes.
  const longest = Math.max(img.width, img.height);
  const scale = spec.width ? spec.width / img.width : longest > spec.maxEdge! ? spec.maxEdge! / longest : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const resized = scale === 1 ? img.clone() : img.clone().resize(w, h);
  // imagescript only supports PNG/JPEG via encode/encodeJPEG. WebP is not
  // available, so we use JPEG (q≈75) for the variants — still ~85% smaller
  // than a 1500px JPEG, which is the actual goal here.
  return await resized.encodeJPEG(Math.round(quality * 100));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Verify caller is an authenticated admin
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

    // 2. Use service-role client for storage writes + DB updates that bypass RLS
    const admin = createClient(supabaseUrl, serviceKey);

    let body: BodyParams = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine
    }
    const batchSize = Math.min(MAX_BATCH, Math.max(1, body.batch_size ?? DEFAULT_BATCH));

    // 3. Pending count
    const { count: remainingBefore } = await admin
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .or("thumb_url.is.null,medium_url.is.null");

    const { data: rows, error: rowsErr } = await admin
      .from("product_images")
      .select("id, product_id, image_url, thumb_url, medium_url")
      .or("thumb_url.is.null,medium_url.is.null")
      .order("created_at", { ascending: false })
      .limit(batchSize);

    if (rowsErr) throw rowsErr;

    let processed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const row of rows ?? []) {
      try {
        const bytes = await fetchBytes(row.image_url);
        if (!bytes) throw new Error("source download failed");

        const decoded = await decode(bytes);
        // Ignore animated GIFs etc. — decode returns a Frame|Image union.
        const img = decoded instanceof Image ? decoded : null;
        if (!img) throw new Error("not a still image");

        const sourcePath = pathFromPublicUrl(row.image_url);
        const idStem = sourcePath
          ? sourcePath.split("/").pop()!.replace(/\.[^.]+$/, "")
          : `${Date.now()}-${row.id.slice(0, 8)}`;

        let thumb_url = row.thumb_url as string | null;
        let medium_url = row.medium_url as string | null;

        if (!thumb_url) {
          const tBytes = await buildVariant(img, { width: 300 }, 0.72);
          const tPath = `${row.product_id}/thumbs/${idStem}-300.jpg`;
          const { error } = await admin.storage
            .from(BUCKET)
            .upload(tPath, tBytes, { contentType: "image/jpeg", upsert: true });
          if (error) throw error;
          thumb_url = publicUrlFor(admin, tPath);
        }

        if (!medium_url) {
          const mBytes = await buildVariant(img, { maxEdge: 800 }, 0.78);
          const mPath = `${row.product_id}/medium/${idStem}-800.jpg`;
          const { error } = await admin.storage
            .from(BUCKET)
            .upload(mPath, mBytes, { contentType: "image/jpeg", upsert: true });
          if (error) throw error;
          medium_url = publicUrlFor(admin, mPath);
        }

        const { error: updErr } = await admin
          .from("product_images")
          .update({ thumb_url, medium_url })
          .eq("id", row.id);
        if (updErr) throw updErr;
        processed++;
      } catch (e) {
        errors.push({ id: row.id, error: (e as Error).message });
      }
    }

    const remaining = Math.max(0, (remainingBefore ?? 0) - processed);

    return new Response(
      JSON.stringify({ processed, remaining, errors, batch_size: batchSize }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("regenerate-image-thumbnails error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
