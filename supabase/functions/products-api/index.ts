// Public read-only Products API for external site/AI integrations.
// Auth: send header `X-API-Key: <PUBLIC_API_KEY>`
//
// Endpoints (GET only):
//   /products-api/products               → list products (query: ?limit=100&offset=0&category=slug)
//   /products-api/products/:id           → single product with variants + images
//   /products-api/categories             → list categories
//
// Image URLs in responses are absolute CDN URLs, ready to import into any destination.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  // Auth
  const apiKey = req.headers.get("x-api-key");
  const expected = Deno.env.get("PUBLIC_API_KEY");
  if (!expected) return json({ error: "Server misconfigured" }, 500);
  if (!apiKey || apiKey !== expected) return json({ error: "Invalid or missing X-API-Key" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const url = new URL(req.url);
  // Strip the function base path (/products-api)
  const path = url.pathname.replace(/^.*\/products-api/, "") || "/";
  const parts = path.split("/").filter(Boolean);

  try {
    // GET /categories
    if (parts[0] === "categories") {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return json({ count: data?.length ?? 0, categories: data });
    }

    // GET /products/:id
    if (parts[0] === "products" && parts[1]) {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, sku, base_price, product_type, is_active, is_featured,
          short_description, full_description, youtube_url, created_at, updated_at,
          category:categories(id, name, slug),
          brand:brands(id, name),
          images:product_images(id, image_url, thumb_url, medium_url, large_url, is_main, sort_order),
          variants:product_variants(id, sku, selling_price, stock_quantity, image_url,
            color:colors(id, name, hex_code),
            size:sizes(id, name),
            material:materials(id, name))
        `)
        .eq("id", parts[1])
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Product not found" }, 404);
      return json({ product: data });
    }

    // GET /products
    if (parts[0] === "products") {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      const offset = parseInt(url.searchParams.get("offset") ?? "0", 10) || 0;
      const categorySlug = url.searchParams.get("category");

      let query = supabase
        .from("products")
        .select(`
          id, name, sku, base_price, product_type, is_active, is_featured,
          short_description, full_description, created_at, updated_at,
          category:categories!inner(id, name, slug),
          brand:brands(id, name),
          images:product_images(image_url, thumb_url, medium_url, large_url, is_main, sort_order),
          variants:product_variants(id, sku, selling_price, stock_quantity, image_url,
            color:colors(name, hex_code), size:sizes(name), material:materials(name))
        `, { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (categorySlug) query = query.eq("category.slug", categorySlug);

      const { data, count, error } = await query;
      if (error) throw error;
      return json({
        total: count ?? 0,
        limit,
        offset,
        count: data?.length ?? 0,
        products: data,
      });
    }

    // GET / (root — API info)
    return json({
      name: "POSHPLEX Products API",
      version: "1.0",
      auth: "Send header: X-API-Key: <your key>",
      endpoints: {
        "GET /products": "List products. Query: ?limit=50&offset=0&category=<slug>",
        "GET /products/:id": "Single product with variants + images",
        "GET /categories": "List active categories",
      },
    });
  } catch (err) {
    console.error("products-api error:", err);
    return json({ error: (err as Error).message || "Internal error" }, 500);
  }
});
