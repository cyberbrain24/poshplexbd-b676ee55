import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getServiceClient, requireAdminKey } from "../_helpers";

export default defineTool({
  name: "storage_upload_from_url",
  title: "Upload image from URL to storage",
  description:
    "Download a remote file and upload it to a Supabase storage bucket. Returns the public URL. Typical use: upload product images by URL.",
  inputSchema: {
    api_key: z.string().describe("MCP_ADMIN_KEY."),
    bucket: z.string().describe("Storage bucket (e.g. 'product-images', 'media', 'review-images')."),
    source_url: z.string().url().describe("Public URL to fetch bytes from."),
    path: z.string().describe("Destination path inside the bucket (e.g. 'imports/2026/shirt-red.jpg')."),
    content_type: z.string().optional().describe("Override MIME type (default: from Content-Type header)."),
    upsert: z.boolean().optional().describe("Overwrite if the path exists (default false)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ api_key, bucket, source_url, path, content_type, upsert }) => {
    const auth = requireAdminKey(api_key);
    if (!auth.ok) return auth.error;
    const res = await fetch(source_url);
    if (!res.ok) {
      return { content: [{ type: "text", text: `Fetch failed: ${res.status} ${res.statusText}` }], isError: true };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    const mime = content_type || res.headers.get("content-type") || "application/octet-stream";
    const supabase = getServiceClient();
    const { error } = await supabase.storage.from(bucket).upload(path, buf, { contentType: mime, upsert: upsert ?? false });
    if (error) return { content: [{ type: "text", text: `Upload error: ${error.message}` }], isError: true };
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return {
      content: [{ type: "text", text: `Uploaded to ${data.publicUrl}` }],
      structuredContent: { bucket, path, public_url: data.publicUrl, content_type: mime, bytes: buf.length },
    };
  },
});
