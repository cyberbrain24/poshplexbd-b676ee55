import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, requireAdminKey, applyFilters } from "../_helpers";

export default defineTool({
  name: "db_update",
  title: "Update rows in any table",
  description: "Update rows matching filters in any POSHPLEX table. Requires filters — refuses to run without them to prevent full-table updates.",
  inputSchema: {
    api_key: z.string().describe("MCP_ADMIN_KEY."),
    table: z.string().describe("Target table."),
    values: z.record(z.any()).describe("Column => new value updates."),
    filters: z.record(z.any()).describe("Filters (equality / IN) — REQUIRED. Prevents accidental full-table updates."),
    returning: z.string().optional().describe("PostgREST select for returned rows (default '*')."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ api_key, table, values, filters, returning }) => {
    const authError = requireAdminKey(api_key);
    if (authError) return authError;
    if (!filters || Object.keys(filters).length === 0) {
      return { content: [{ type: "text", text: "Refusing to update: filters are required." }], isError: true };
    }
    const supabase = getServiceClient();
    let query: any = supabase.from(table).update(values);
    query = applyFilters(query, filters);
    const { data, error } = await query.select(returning ?? "*");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Updated ${data?.length ?? 0} row(s) in ${table}.` }],
      structuredContent: { updated: data ?? [] },
    };
  },
});
