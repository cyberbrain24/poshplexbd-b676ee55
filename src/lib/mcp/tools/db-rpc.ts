import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, requireAdminKey } from "../_helpers";

export default defineTool({
  name: "db_rpc",
  title: "Call a database function",
  description:
    "Invoke a Postgres function (RPC) in the public schema — e.g. create_order_atomic, record_order_payment_atomic, upsert_checkout_customer, track_orders_lookup.",
  inputSchema: {
    api_key: z.string().describe("MCP_ADMIN_KEY."),
    function: z.string().describe("Function name."),
    args: z.record(z.any()).optional().describe("Named arguments object."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ api_key, function: fn, args }) => {
    const auth = requireAdminKey(api_key);
    if (!auth.ok) return auth.error;
    const supabase = getServiceClient();
    const { data, error } = await supabase.rpc(fn, args ?? {});
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return {
      content: [{ type: "text", text: `Called ${fn}.` }],
      structuredContent: { result: data },
    };
  },
});
