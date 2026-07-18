import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List all active POSHPLEX product categories with their slugs.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Found ${data?.length ?? 0} categories.` }],
      structuredContent: { categories: data ?? [] },
    };
  },
});
