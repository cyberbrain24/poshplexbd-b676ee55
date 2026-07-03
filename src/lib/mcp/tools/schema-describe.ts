import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient } from "../_helpers";

export default defineTool({
  name: "schema_describe",
  title: "Describe database schema",
  description:
    "List tables in the public schema, or return columns for a specific table (name, type, nullable, default). Use this to discover the shape of the database before calling db_insert/update.",
  inputSchema: {
    table: z.string().optional().describe("Optional table name. Omit to list all tables."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table }) => {
    const supabase = getServiceClient();
    if (!table) {
      const { data, error } = await supabase
        .from("information_schema.tables" as any)
        .select("table_name")
        .eq("table_schema", "public")
        .order("table_name");
      if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      const tables = (data ?? []).map((r: any) => r.table_name);
      return {
        content: [{ type: "text", text: `Found ${tables.length} tables.` }],
        structuredContent: { tables },
      };
    }
    const { data, error } = await supabase
      .from("information_schema.columns" as any)
      .select("column_name, data_type, is_nullable, column_default")
      .eq("table_schema", "public")
      .eq("table_name", table)
      .order("ordinal_position");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `${data?.length ?? 0} columns in ${table}.` }],
      structuredContent: { table, columns: data ?? [] },
    };
  },
});
