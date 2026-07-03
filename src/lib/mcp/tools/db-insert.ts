import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, requireAdminKey } from "../_helpers";

export default defineTool({
  name: "db_insert",
  title: "Insert rows into any table",
  description:
    "Insert one or many rows into any POSHPLEX table (products, categories, orders, inventory, etc). Returns inserted rows.",
  inputSchema: {
    api_key: z.string().describe("MCP_ADMIN_KEY."),
    table: z.string().describe("Target table."),
    rows: z.union([z.record(z.any()), z.array(z.record(z.any()))]).describe("Single row object or array of row objects."),
    returning: z.string().optional().describe("PostgREST select for returned rows (default '*')."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ api_key, table, rows, returning }) => {
    const authError = requireAdminKey(api_key);
    if (authError) return authError;
    const supabase = getServiceClient();
    const { data, error } = await supabase.from(table).insert(rows as any).select(returning ?? "*");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Inserted ${data?.length ?? 0} row(s) into ${table}.` }],
      structuredContent: { inserted: data ?? [] },
    };
  },
});
