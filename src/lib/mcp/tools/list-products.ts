import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description:
    "List active POSHPLEX products with images, variants, category, and brand. Supports pagination and optional category slug filter.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Max products (default 50)"),
    offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)"),
    category_slug: z.string().optional().describe("Filter by category slug"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, offset, category_slug }) => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    );
    const lim = Math.min(limit ?? 50, 200);
    const off = offset ?? 0;

    let query = supabase
      .from("products")
      .select(
        `id, name, sku, base_price, product_type, is_featured,
         short_description, full_description, created_at,
         category:categories!inner(id, name, slug),
         brand:brands(id, name),
         images:product_images(image_url, is_main, sort_order),
         variants:product_variants(id, sku, selling_price, stock_quantity, image_url,
           color:colors(name, hex_code), size:sizes(label), material:materials(name))`,
        { count: "exact" },
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(off, off + lim - 1);

    if (category_slug) query = query.eq("category.slug", category_slug);

    const { data, count, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }

    return {
      content: [{ type: "text", text: `Found ${count ?? 0} products (returning ${data?.length ?? 0}).` }],
      structuredContent: { total: count ?? 0, limit: lim, offset: off, products: data ?? [] },
    };
  },
});
