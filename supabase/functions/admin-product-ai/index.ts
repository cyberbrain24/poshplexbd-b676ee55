// Admin Product AI Assistant — Gemini tool calling
// Read tools auto-execute; write tools require client confirmation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "google/gemini-2.5-flash";

const READ_TOOLS = new Set([
  "list_products", "get_product", "list_categories", "list_brands",
  "list_colors", "list_sizes", "list_materials", "list_size_guides",
  "list_care_instructions", "get_site_overview",
]);

const WRITE_TOOLS = new Set([
  "create_product", "update_product", "delete_product",
  "add_product_image", "delete_product_image", "set_product_active",
  "set_product_featured",
]);

const tools = [
  // READ
  { type: "function", function: { name: "list_products", description: "List products. Optional search by name/SKU.", parameters: { type: "object", properties: { search: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_product", description: "Get full product details by id, name, or SKU.", parameters: { type: "object", properties: { identifier: { type: "string" } }, required: ["identifier"] } } },
  { type: "function", function: { name: "list_categories", description: "List all categories.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_brands", description: "List all brands.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_colors", description: "List colors.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_sizes", description: "List sizes.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_materials", description: "List materials.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_size_guides", description: "List size guides.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_care_instructions", description: "List care instructions.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_site_overview", description: "Site-wide counts (products, orders, customers, revenue).", parameters: { type: "object", properties: {} } } },
  // WRITE
  { type: "function", function: { name: "create_product", description: "Create a new product. Accepts name, sku (optional), base_price, short_description, full_description, brand_id, category_id, product_type ('simple'|'variable'), is_active, is_featured.", parameters: { type: "object", properties: {
    name: { type: "string" }, sku: { type: "string" }, base_price: { type: "number" },
    short_description: { type: "string" }, full_description: { type: "string" },
    brand_id: { type: "string" }, category_id: { type: "string" },
    product_type: { type: "string" }, is_active: { type: "boolean" }, is_featured: { type: "boolean" },
  }, required: ["name", "base_price"] } } },
  { type: "function", function: { name: "update_product", description: "Update fields on an existing product. Pass product_id and any fields to change.", parameters: { type: "object", properties: {
    product_id: { type: "string" }, name: { type: "string" }, sku: { type: "string" },
    base_price: { type: "number" }, short_description: { type: "string" }, full_description: { type: "string" },
    brand_id: { type: "string" }, category_id: { type: "string" },
    is_active: { type: "boolean" }, is_featured: { type: "boolean" },
  }, required: ["product_id"] } } },
  { type: "function", function: { name: "delete_product", description: "Delete a product by id.", parameters: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } } },
  { type: "function", function: { name: "set_product_active", description: "Toggle product active status.", parameters: { type: "object", properties: { product_id: { type: "string" }, is_active: { type: "boolean" } }, required: ["product_id", "is_active"] } } },
  { type: "function", function: { name: "set_product_featured", description: "Toggle product featured status.", parameters: { type: "object", properties: { product_id: { type: "string" }, is_featured: { type: "boolean" } }, required: ["product_id", "is_featured"] } } },
  { type: "function", function: { name: "add_product_image", description: "Attach an image URL to a product.", parameters: { type: "object", properties: { product_id: { type: "string" }, image_url: { type: "string" }, is_main: { type: "boolean" }, alt_text: { type: "string" } }, required: ["product_id", "image_url"] } } },
  { type: "function", function: { name: "delete_product_image", description: "Delete a product image by id.", parameters: { type: "object", properties: { image_id: { type: "string" } }, required: ["image_id"] } } },
];

const SYSTEM_PROMPT = `You are POSHPLEX's admin AI assistant. The brand is a Bangladesh streetwear store ("BE POSH WITH POSHPLEX"). Currency is Taka (৳).

You manage the PRODUCT catalog only. For non-product topics (orders, customers, analytics, settings) you can DESCRIBE the site but you do NOT have tools to modify them — politely tell the admin to use that admin page directly.

Rules:
- Always look up products by name first using list_products if the admin doesn't give an id.
- For prices, the admin uses Taka (৳). Don't add currency symbols inside the database.
- When creating products, default product_type to "simple" unless variants are mentioned.
- After making any change, briefly confirm what changed.
- Be terse. Use markdown lists/tables when helpful.
- If the user asks about anything outside product management (orders, customers, analytics, site settings, promo codes, inventory), explain what's available on the relevant admin page and offer to help with products.

Site context: This is the POSHPLEX e-commerce admin. Other modules (which you cannot edit but can describe): Orders, Customers, Reviews, Categories management, Brands, Inventory, Accounts (financial), Promo Codes, Site Settings, Media library.`;

async function executeTool(name: string, args: any, sb: any) {
  try {
    switch (name) {
      case "list_products": {
        let q = sb.from("products").select("id, name, sku, base_price, is_active, is_featured, product_type, category_id").limit(args.limit || 25).order("created_at", { ascending: false });
        if (args.search) q = q.or(`name.ilike.%${args.search}%,sku.ilike.%${args.search}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { products: data };
      }
      case "get_product": {
        const id = args.identifier;
        const isUuid = /^[0-9a-f]{8}-/i.test(id);
        let { data: p } = isUuid
          ? await sb.from("products").select("*").eq("id", id).maybeSingle()
          : await sb.from("products").select("*").or(`name.ilike.%${id}%,sku.eq.${id}`).maybeSingle();
        if (!p) return { error: "Product not found" };
        const [{ data: images }, { data: variants }] = await Promise.all([
          sb.from("product_images").select("id, image_url, is_main, sort_order").eq("product_id", p.id),
          sb.from("product_variants").select("id, sku, selling_price, stock_quantity, color_id, size_id").eq("product_id", p.id),
        ]);
        return { product: p, images, variants };
      }
      case "list_categories": return { categories: (await sb.from("categories").select("id, name, parent_id").order("name")).data };
      case "list_brands": return { brands: (await sb.from("brands").select("id, name").order("name")).data };
      case "list_colors": return { colors: (await sb.from("colors").select("id, name, hex_code")).data };
      case "list_sizes": return { sizes: (await sb.from("sizes").select("id, name, sort_order").order("sort_order")).data };
      case "list_materials": return { materials: (await sb.from("materials").select("id, name, gsm")).data };
      case "list_size_guides": return { size_guides: (await sb.from("size_guides").select("id, name")).data };
      case "list_care_instructions": return { care_instructions: (await sb.from("care_instructions").select("id, name")).data };
      case "get_site_overview": {
        const [p, o, c, rev] = await Promise.all([
          sb.from("products").select("id", { count: "exact", head: true }),
          sb.from("orders").select("id", { count: "exact", head: true }),
          sb.from("customers").select("id", { count: "exact", head: true }),
          sb.from("orders").select("total_amount").eq("payment_status", "paid"),
        ]);
        const totalRev = (rev.data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
        return { products: p.count, orders: o.count, customers: c.count, total_paid_revenue_bdt: totalRev };
      }
      case "create_product": {
        const { data, error } = await sb.from("products").insert({
          name: args.name, sku: args.sku || null, base_price: args.base_price,
          short_description: args.short_description, full_description: args.full_description,
          brand_id: args.brand_id, category_id: args.category_id,
          product_type: args.product_type || "simple",
          is_active: args.is_active ?? true, is_featured: args.is_featured ?? false,
        }).select().single();
        if (error) throw error;
        if (args.category_id) await sb.from("product_categories").insert({ product_id: data.id, category_id: args.category_id });
        return { success: true, product: data };
      }
      case "update_product": {
        const { product_id, ...patch } = args;
        const { data, error } = await sb.from("products").update(patch).eq("id", product_id).select().single();
        if (error) throw error;
        return { success: true, product: data };
      }
      case "delete_product": {
        const { error } = await sb.from("products").delete().eq("id", args.product_id);
        if (error) throw error;
        return { success: true };
      }
      case "set_product_active": {
        const { error } = await sb.from("products").update({ is_active: args.is_active }).eq("id", args.product_id);
        if (error) throw error;
        return { success: true };
      }
      case "set_product_featured": {
        const { error } = await sb.from("products").update({ is_featured: args.is_featured }).eq("id", args.product_id);
        if (error) throw error;
        return { success: true };
      }
      case "add_product_image": {
        const { data, error } = await sb.from("product_images").insert({
          product_id: args.product_id, image_url: args.image_url,
          is_main: args.is_main ?? false, alt_text: args.alt_text,
        }).select().single();
        if (error) throw error;
        return { success: true, image: data };
      }
      case "delete_product_image": {
        const { error } = await sb.from("product_images").delete().eq("id", args.image_id);
        if (error) throw error;
        return { success: true };
      }
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (e: any) {
    return { error: e.message || String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth + admin check
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return jsonResp({ error: "Unauthorized" }, 401);

    const sbAuth = createClient(SUPABASE_URL, SERVICE_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await sbAuth.auth.getUser(token);
    if (!userData?.user) return jsonResp({ error: "Unauthorized" }, 401);

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await sb.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return jsonResp({ error: "Admin only" }, 403);

    const body = await req.json();
    const messages = body.messages || [];
    const confirmedAction = body.confirmed_action; // {name, args, tool_call_id} after user approves

    // If a confirmed write action is provided, execute it and continue
    if (confirmedAction) {
      const result = await executeTool(confirmedAction.name, confirmedAction.args, sb);
      messages.push({
        role: "tool",
        tool_call_id: confirmedAction.tool_call_id,
        content: JSON.stringify(result),
      });
    }

    // Tool-calling loop (max 8 iterations)
    let convo = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    for (let i = 0; i < 8; i++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, messages: convo, tools, tool_choice: "auto" }),
      });

      if (!aiResp.ok) {
        const txt = await aiResp.text();
        if (aiResp.status === 429) return jsonResp({ error: "Rate limit. Try again in a moment." }, 429);
        if (aiResp.status === 402) return jsonResp({ error: "AI credits exhausted. Add credits in workspace settings." }, 402);
        console.error("AI error", aiResp.status, txt);
        return jsonResp({ error: "AI service error" }, 500);
      }

      const data = await aiResp.json();
      const msg = data.choices?.[0]?.message;
      if (!msg) return jsonResp({ error: "Empty AI response" }, 500);

      convo.push(msg);

      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        // Final assistant text
        return jsonResp({
          type: "message",
          content: msg.content || "",
          messages: convo.slice(1), // strip system
        });
      }

      // Process tool calls
      let needsConfirmation: any = null;
      for (const call of toolCalls) {
        const name = call.function.name;
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch {}

        if (WRITE_TOOLS.has(name)) {
          // Stop and ask user to confirm. Persist conversation up to (but excluding) this tool's result.
          needsConfirmation = { tool_call_id: call.id, name, args };
          break;
        }
        if (READ_TOOLS.has(name)) {
          const result = await executeTool(name, args, sb);
          convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        } else {
          convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "Unknown tool" }) });
        }
      }

      if (needsConfirmation) {
        return jsonResp({
          type: "confirm",
          pending_action: needsConfirmation,
          messages: convo.slice(1),
        });
      }
    }

    return jsonResp({ type: "message", content: "Reached tool-call limit.", messages: convo.slice(1) });
  } catch (e: any) {
    console.error("admin-product-ai error", e);
    return jsonResp({ error: e.message || "Server error" }, 500);
  }
});

function jsonResp(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
