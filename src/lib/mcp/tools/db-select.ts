import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, applyFilters } from "../_helpers";

export default defineTool({
  name: "db_select",
  title: "Read rows from any table",
  description:
    "Read rows from any table in the POSHPLEX database. Supports select columns, equality/IN filters, order, and range. No auth required for reads.",
  inputSchema: {
    table: z.string().describe("Table name (e.g. 'products', 'orders', 'customers')."),
    select: z.string().optional().describe("PostgREST select string. Default '*'. Can include joins like '*,category:categories(name,slug)'."),
    filters: z.record(z.any()).optional().describe("Object of column => value (equality) or column => array (IN). null matches IS NULL."),
    order_by: z.string().optional().describe("Column to order by."),
    ascending: z.boolean().optional().describe("Ascending order (default false)."),
    limit: z.number().int().min(1).max(500).optional().describe("Max rows (default 50)."),
    offset: z.number().int().min(0).optional().describe("Pagination offset (default 0)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, select, filters, order_by, ascending, limit, offset }) => {
    const supabase = getServiceClient();
    const lim = limit ?? 50;
    const off = offset ?? 0;
    let query = supabase.from(table).select(select ?? "*", { count: "exact" }).range(off, off + lim - 1);
    if (order_by) query = query.order(order_by, { ascending: ascending ?? false });
    query = applyFilters(query, filters);
    const { data, count, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Returned ${data?.length ?? 0} of ${count ?? 0} rows from ${table}.` }],
      structuredContent: { total: count ?? 0, limit: lim, offset: off, rows: data ?? [] },
    };
  },
});
