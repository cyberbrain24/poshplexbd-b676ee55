import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Get a single POSHPLEX product by its UUID, including all images and variants.",
  inputSchema: {
    id: z.string().uuid().describe("Product UUID"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, sku, base_price, product_type, is_active, is_featured,
         short_description, full_description, youtube_url, created_at, updated_at,
         category:categories(id, name, slug),
         brand:brands(id, name),
         images:product_images(id, image_url, thumb_url, medium_url, large_url, is_main, sort_order),
         variants:product_variants(id, sku, selling_price, stock_quantity, image_url,
           color:colors(id, name, hex_code),
           size:sizes(id, label),
           material:materials(id, name))`,
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    if (!data) {
      return { content: [{ type: "text", text: "Product not found" }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Product: ${data.name}` }],
      structuredContent: { product: data },
    };
  },
});
