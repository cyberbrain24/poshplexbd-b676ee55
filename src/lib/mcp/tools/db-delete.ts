import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, requireAdminKey, applyFilters } from "../_helpers";

export default defineTool({
  name: "db_delete",
  title: "Delete rows from any table",
  description: "Delete rows matching filters in any POSHPLEX table. Requires filters — refuses to run without them to prevent full-table deletes.",
  inputSchema: {
    api_key: z.string().describe("MCP_ADMIN_KEY."),
    table: z.string().describe("Target table."),
    filters: z.record(z.any()).describe("Filters (equality / IN) — REQUIRED. Prevents accidental full-table deletes."),
    returning: z.string().optional().describe("PostgREST select for returned rows (default 'id')."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ api_key, table, filters, returning }) => {
    const authError = requireAdminKey(api_key);
    if (authError) return authError;
    if (!filters || Object.keys(filters).length === 0) {
      return { content: [{ type: "text", text: "Refusing to delete: filters are required." }], isError: true };
    }
    const supabase = getServiceClient();
    let query: any = supabase.from(table).delete();
    query = applyFilters(query, filters);
    const { data, error } = await query.select(returning ?? "id");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Deleted ${data?.length ?? 0} row(s) from ${table}.` }],
      structuredContent: { deleted: data ?? [] },
    };
  },
});
