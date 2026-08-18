import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const BUCKET = "product-images";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "product";

const pathFromUrl = (url: string): string | null => {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsOptions(req);
  const cors = { ...getCorsHeaders(req), "Content-Type": "application/json" };

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // --- auth: caller must be an admin ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: cors });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dryRun === true;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: rows, error } = await admin
      .from("product_images")
      .select("id, product_id, image_url, thumb_url, medium_url, large_url, is_main, sort_order, created_at, products(name)")
      .order("product_id", { ascending: true })
      .order("is_main", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;

    const publicUrl = (p: string) => admin.storage.from(BUCKET).getPublicUrl(p).data.publicUrl;

    const counters: Record<string, number> = {};
    const urlMap: Record<string, string> = {};
    let moved = 0, renamedRows = 0, skipped = 0;
    const errors: string[] = [];

    for (const row of (rows ?? []) as any[]) {
      const slug = slugify(row.products?.name ?? "product");
      counters[slug] = (counters[slug] ?? 0) + 1;
      const n = counters[slug];

      const targets: Array<[string, string | null, string]> = [
        ["image_url", row.image_url, `${row.product_id}/${slug}-${n}.webp`],
        ["thumb_url", row.thumb_url, `${row.product_id}/thumbs/${slug}-${n}-150.webp`],
        ["medium_url", row.medium_url, `${row.product_id}/medium/${slug}-${n}-300.webp`],
        ["large_url", row.large_url, `${row.product_id}/large/${slug}-${n}-450.webp`],
      ];

      const updates: Record<string, string> = {};
      for (const [col, url, newPath] of targets) {
        if (!url) continue;
        const oldPath = pathFromUrl(url);
        if (!oldPath) continue;
        if (oldPath === newPath) { skipped++; continue; }
        if (dryRun) { updates[col] = publicUrl(newPath); moved++; continue; }

        const { error: mvErr } = await admin.storage.from(BUCKET).move(oldPath, newPath);
        if (mvErr) {
          // If the destination already holds the file, just repoint the row.
          const { data: head } = await admin.storage.from(BUCKET).list(newPath.split("/").slice(0, -1).join("/"), {
            search: newPath.split("/").pop(),
          });
          if (!head || head.length === 0) { errors.push(`${oldPath}: ${mvErr.message}`); continue; }
        }
        const newUrl = publicUrl(newPath);
        urlMap[url] = newUrl;
        updates[col] = newUrl;
        moved++;
      }

      if (Object.keys(updates).length > 0) {
        renamedRows++;
        if (!dryRun) {
          const { error: upErr } = await admin.from("product_images").update(updates).eq("id", row.id);
          if (upErr) errors.push(`row ${row.id}: ${upErr.message}`);
        }
      }
    }

    // Repoint variant images that referenced any renamed file
    let variantsUpdated = 0;
    if (!dryRun && Object.keys(urlMap).length > 0) {
      const { data: variants } = await admin
        .from("product_variants")
        .select("id, image_url")
        .not("image_url", "is", null);
      for (const v of variants ?? []) {
        const next = urlMap[(v as any).image_url];
        if (!next) continue;
        const { error: vErr } = await admin.from("product_variants").update({ image_url: next }).eq("id", (v as any).id);
        if (vErr) errors.push(`variant ${(v as any).id}: ${vErr.message}`);
        else variantsUpdated++;
      }
    }

    return new Response(
      JSON.stringify({ dryRun, rows: rows?.length ?? 0, filesMoved: moved, rowsUpdated: renamedRows, alreadyNamed: skipped, variantsUpdated, errors: errors.slice(0, 20), errorCount: errors.length }),
      { headers: cors },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), { status: 500, headers: cors });
  }
});
