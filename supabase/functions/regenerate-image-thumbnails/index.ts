// Admin-only backfill: regenerates the three WebP-shaped thumbnail
// variants for product_images rows that are missing any of them:
//   - 150 px wide  → thumb_url   (small)
//   - 300 px wide  → medium_url
//   - 450 px wide  → large_url
// Designed to be polled in batches from the admin UI until `remaining === 0`.

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

const VARIANT_SPECS: Array<{
  column: "thumb_url" | "medium_url" | "large_url";
  folder: "thumbs" | "medium" | "large";
  width: 150 | 300 | 450;
  quality: number;
}> = [
  { column: "thumb_url", folder: "thumbs", width: 150, quality: 0.7 },
  { column: "medium_url", folder: "medium", width: 300, quality: 0.74 },
  { column: "large_url", folder: "large", width: 450, quality: 0.8 },
];

function publicUrlFor(supabase: ReturnType<typeof createClient>, path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Convert a public Supabase storage URL back to its in-bucket path. */
function pathFromPublicUrl(url: string): string | null {
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

async function buildVariant(img: Image, width: number, quality: number): Promise<Uint8Array> {
  const scale = width / img.width;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const resized = scale === 1 ? img.clone() : img.clone().resize(w, h);
  // imagescript only supports PNG/JPEG via encode/encodeJPEG. WebP is not
  // available, so we use JPEG (q≈70-80) for the variants.
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

    const missingFilter = "thumb_url.is.null,medium_url.is.null,large_url.is.null";

    // 3. Pending count
    const { count: remainingBefore } = await admin
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .or(missingFilter);

    const { data: rows, error: rowsErr } = await admin
      .from("product_images")
      .select("id, product_id, image_url, thumb_url, medium_url, large_url")
      .or(missingFilter)
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
        const img = decoded instanceof Image ? decoded : null;
        if (!img) throw new Error("not a still image");

        const sourcePath = pathFromPublicUrl(row.image_url);
        const idStem = sourcePath
          ? sourcePath.split("/").pop()!.replace(/\.[^.]+$/, "")
          : `${Date.now()}-${row.id.slice(0, 8)}`;

        const updates: Record<string, string> = {};

        for (const spec of VARIANT_SPECS) {
          const existing = (row as any)[spec.column] as string | null;
          if (existing) continue;
          const out = await buildVariant(img, spec.width, spec.quality);
          const path = `${row.product_id}/${spec.folder}/${idStem}-${spec.width}.jpg`;
          const { error } = await admin.storage
            .from(BUCKET)
            .upload(path, out, { contentType: "image/jpeg", upsert: true });
          if (error) throw error;
          updates[spec.column] = publicUrlFor(admin, path);
        }

        if (Object.keys(updates).length > 0) {
          const { error: updErr } = await admin
            .from("product_images")
            .update(updates)
            .eq("id", row.id);
          if (updErr) throw updErr;
        }
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

  }
});
