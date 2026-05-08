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
  // Catalog
  "list_products", "get_product", "list_categories", "list_brands",
  "list_colors", "list_sizes", "list_materials", "list_size_guides",
  "list_care_instructions",
  // Orders
  "list_orders", "get_order", "get_order_items",
  // Customers
  "list_customers", "get_customer", "list_customer_types",
  // Reviews
  "list_reviews",
  // Inventory
  "list_inventory_products", "list_low_stock_variants", "list_inventory_entries",
  // Finance
  "list_accounts", "list_transactions", "list_order_payments",
  // Marketing
  "list_promo_codes", "list_payment_methods",
  // Locations
  "list_divisions", "list_thanas",
  // Site / Analytics
  "get_site_overview", "get_sales_analytics", "get_top_products", "get_top_customers",
  "get_site_settings", "get_site_branding",
]);

const WRITE_TOOLS = new Set([
  // Products
  "create_product", "update_product", "delete_product",
  "add_product_image", "delete_product_image", "set_product_active",
  "set_product_featured",
  // Customers
  "create_customer", "update_customer", "delete_customer",
  // Orders
  "update_order", "delete_order", "set_order_status", "set_payment_status",
  "update_order_item", "add_order_payment",
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
  { type: "function", function: { name: "list_orders", description: "List recent orders with optional filters.", parameters: { type: "object", properties: { status: { type: "string", description: "pending|confirmed|shipped|delivered|cancelled|partially_delivered" }, payment_status: { type: "string", description: "unpaid|partial|paid|refunded" }, search: { type: "string", description: "Order number or customer phone" }, limit: { type: "number" }, days: { type: "number", description: "Only orders from last N days" } } } } },
  { type: "function", function: { name: "get_order", description: "Get full order details by order_number or id.", parameters: { type: "object", properties: { identifier: { type: "string" } }, required: ["identifier"] } } },
  { type: "function", function: { name: "get_order_items", description: "List items for an order id.", parameters: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } } },
  { type: "function", function: { name: "list_customers", description: "List customers, optional search by name/phone/email.", parameters: { type: "object", properties: { search: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_customer", description: "Get customer details + order history by id, phone, or email.", parameters: { type: "object", properties: { identifier: { type: "string" } }, required: ["identifier"] } } },
  { type: "function", function: { name: "list_customer_types", description: "List membership/customer types.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_reviews", description: "List reviews. Filter by approval status or product.", parameters: { type: "object", properties: { is_approved: { type: "boolean" }, product_id: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_inventory_products", description: "List independent inventory products with stock.", parameters: { type: "object", properties: { search: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_low_stock_variants", description: "Catalog product variants below their low_stock_threshold.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_inventory_entries", description: "Recent inventory in/out entries.", parameters: { type: "object", properties: { type: { type: "string", description: "in|out" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_accounts", description: "List financial accounts with current balances.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_transactions", description: "Recent finance transactions (income/expense/transfer).", parameters: { type: "object", properties: { type: { type: "string" }, account_id: { type: "string" }, limit: { type: "number" }, days: { type: "number" } } } } },
  { type: "function", function: { name: "list_order_payments", description: "Recent payments recorded against orders.", parameters: { type: "object", properties: { order_id: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_promo_codes", description: "List promo codes with usage.", parameters: { type: "object", properties: { is_active: { type: "boolean" } } } } },
  { type: "function", function: { name: "list_payment_methods", description: "List configured payment methods.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_divisions", description: "List shipping divisions/districts.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_thanas", description: "List thanas (delivery zones), optionally filter by division.", parameters: { type: "object", properties: { division_id: { type: "string" } } } } },
  { type: "function", function: { name: "get_sales_analytics", description: "Sales analytics: revenue, order count, AOV over a window.", parameters: { type: "object", properties: { days: { type: "number", description: "Window size, default 30" } } } } },
  { type: "function", function: { name: "get_top_products", description: "Best-selling products by quantity.", parameters: { type: "object", properties: { limit: { type: "number" }, days: { type: "number" } } } } },
  { type: "function", function: { name: "get_top_customers", description: "Top customers by total spent.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_site_settings", description: "Public site settings (analytics, pixel ids).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_site_branding", description: "Site branding info (name, slogan, hero).", parameters: { type: "object", properties: {} } } },
  // WRITE — Customers
  { type: "function", function: { name: "create_customer", description: "Create a new customer. Phone is required.", parameters: { type: "object", properties: {
    name: { type: "string" }, phone: { type: "string" }, email: { type: "string" },
    gender: { type: "string", description: "male|female|other" }, address: { type: "string" },
    division_id: { type: "string" }, thana_id: { type: "string" }, postal_code: { type: "string" },
    customer_type_id: { type: "string" }, notes: { type: "string" }, is_active: { type: "boolean" },
  }, required: ["name", "phone"] } } },
  { type: "function", function: { name: "update_customer", description: "Update customer fields. Pass customer_id and any fields.", parameters: { type: "object", properties: {
    customer_id: { type: "string" }, name: { type: "string" }, phone: { type: "string" },
    email: { type: "string" }, gender: { type: "string" }, address: { type: "string" },
    division_id: { type: "string" }, thana_id: { type: "string" }, postal_code: { type: "string" },
    customer_type_id: { type: "string" }, notes: { type: "string" }, is_active: { type: "boolean" },
    birthdate: { type: "string" },
  }, required: ["customer_id"] } } },
  { type: "function", function: { name: "delete_customer", description: "Delete a customer by id. Will fail if linked orders exist.", parameters: { type: "object", properties: { customer_id: { type: "string" } }, required: ["customer_id"] } } },
  // WRITE — Orders
  { type: "function", function: { name: "update_order", description: "Update mutable order fields (shipping info, notes, tracking, courier, amounts).", parameters: { type: "object", properties: {
    order_id: { type: "string" }, shipping_name: { type: "string" }, shipping_phone: { type: "string" },
    shipping_email: { type: "string" }, shipping_address: { type: "string" }, shipping_city: { type: "string" },
    shipping_division_id: { type: "string" }, shipping_thana_id: { type: "string" }, shipping_postal_code: { type: "string" },
    tracking_number: { type: "string" }, courier_name: { type: "string" },
    customer_notes: { type: "string" }, internal_notes: { type: "string" },
    discount_amount: { type: "number" }, shipping_cost: { type: "number" }, total_amount: { type: "number" },
  }, required: ["order_id"] } } },
  { type: "function", function: { name: "set_order_status", description: "Change order_status. Logs status history.", parameters: { type: "object", properties: {
    order_id: { type: "string" },
    status: { type: "string", description: "pending|confirmed|processing|shipped|delivered|partially_delivered|cancelled|returned" },
    notes: { type: "string" },
  }, required: ["order_id", "status"] } } },
  { type: "function", function: { name: "set_payment_status", description: "Change payment_status of an order.", parameters: { type: "object", properties: {
    order_id: { type: "string" },
    payment_status: { type: "string", description: "unpaid|partial|paid|refunded" },
    notes: { type: "string" },
  }, required: ["order_id", "payment_status"] } } },
  { type: "function", function: { name: "update_order_item", description: "Update an order item: quantity, unit_price, fulfillment_status, or delete.", parameters: { type: "object", properties: {
    item_id: { type: "string" }, quantity: { type: "number" }, unit_price: { type: "number" },
    fulfillment_status: { type: "string", description: "pending|processing|shipped|delivered|cancelled|out_of_stock|returned" },
    delete: { type: "boolean", description: "If true, delete the item." },
  }, required: ["item_id"] } } },
  { type: "function", function: { name: "add_order_payment", description: "Record a manual payment against an order into a financial account.", parameters: { type: "object", properties: {
    order_id: { type: "string" }, account_id: { type: "string" }, amount: { type: "number" },
    payment_reference: { type: "string" },
  }, required: ["order_id", "account_id", "amount"] } } },
  { type: "function", function: { name: "delete_order", description: "Delete an order by id (irreversible).", parameters: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } } },
];

const SYSTEM_PROMPT = `You are POSHPLEX's admin AI assistant. The brand is a Bangladesh streetwear store ("BE POSH WITH POSHPLEX"). Currency is Taka (৳), locale en-BD.

You have READ access to EVERY module of the system: products, orders, customers, reviews, inventory, financial accounts, transactions, payments, promo codes, payment methods, shipping locations (Districts/Thanas), site settings, and analytics. Use the appropriate tool to look up real data — never guess numbers.

You have WRITE access to: PRODUCTS (create/update/delete/toggle/images), CUSTOMERS (create/update/delete), and ORDERS (update fields, change status, change payment status, edit/delete items, record payments, delete order). For other modules (finance accounts, inventory entries, promo codes, etc.) explain what you see and tell the admin to use that admin page.

When the admin asks to change a customer or order, first look it up by phone/email/order_number to get the id, then call the right write tool. Always confirm the destructive action briefly after it runs.

Rules:
- Always look up real data with tools before answering. Don't fabricate.
- Prefer narrow queries: use search/filters and small limits when scanning a module.
- For dates use ISO; format Taka as ৳ in user-facing replies.
- Be terse. Use markdown lists/tables when helpful.
- For prices in DB, never include the ৳ symbol.
- When creating products, default product_type to "simple" unless variants are mentioned.
- After making any change, briefly confirm what changed.

Modules summary:
- Products: catalog with variants, images, categories (junction), brands, colors, sizes, materials, size guides, care instructions.
- Orders: PO-XXXXX numbers, status (pending/confirmed/shipped/delivered/...), payment_status (unpaid/partial/paid/refunded), Steadfast courier integration.
- Customers: linked to auth via customer_accounts; have phone, email, division/thana, customer_type (membership).
- Inventory: independent inventory_products + entries (in/out); also product_variants stock_quantity for the catalog.
- Finance: accounts (balances), transactions (income/expense/transfer), order_payments (linked to orders).
- Marketing: promo_codes, payment_methods (COD, Mobile Banking).
- Locations: divisions (districts) -> thanas (delivery zones).`;

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
      // ====== EXTENDED READ TOOLS (all modules) ======
      case "list_orders": {
        let q = sb.from("orders").select("id, order_number, customer_id, shipping_name, shipping_phone, order_status, payment_status, total_amount, paid_amount, created_at").order("created_at", { ascending: false }).limit(args.limit || 25);
        if (args.status) q = q.eq("order_status", args.status);
        if (args.payment_status) q = q.eq("payment_status", args.payment_status);
        if (args.search) q = q.or(`order_number.ilike.%${args.search}%,shipping_phone.ilike.%${args.search}%,shipping_name.ilike.%${args.search}%`);
        if (args.days) q = q.gte("created_at", new Date(Date.now() - args.days * 86400000).toISOString());
        const { data, error } = await q;
        if (error) throw error;
        return { orders: data };
      }
      case "get_order": {
        const id = args.identifier;
        const isUuid = /^[0-9a-f]{8}-/i.test(id);
        const { data: order } = isUuid
          ? await sb.from("orders").select("*").eq("id", id).maybeSingle()
          : await sb.from("orders").select("*").eq("order_number", id).maybeSingle();
        if (!order) return { error: "Order not found" };
        const [{ data: items }, { data: history }, { data: payments }] = await Promise.all([
          sb.from("order_items").select("*").eq("order_id", order.id),
          sb.from("order_status_history").select("*").eq("order_id", order.id).order("created_at", { ascending: false }).limit(20),
          sb.from("order_payments").select("*").eq("order_id", order.id),
        ]);
        return { order, items, status_history: history, payments };
      }
      case "get_order_items": {
        const { data, error } = await sb.from("order_items").select("*").eq("order_id", args.order_id);
        if (error) throw error;
        return { items: data };
      }
      case "list_customers": {
        let q = sb.from("customers").select("id, name, phone, email, gender, division_id, thana_id, customer_type_id, is_active, created_at").order("created_at", { ascending: false }).limit(args.limit || 25);
        if (args.search) q = q.or(`name.ilike.%${args.search}%,phone.ilike.%${args.search}%,email.ilike.%${args.search}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { customers: data };
      }
      case "get_customer": {
        const id = args.identifier;
        const isUuid = /^[0-9a-f]{8}-/i.test(id);
        let { data: customer } = isUuid
          ? await sb.from("customers").select("*").eq("id", id).maybeSingle()
          : await sb.from("customers").select("*").or(`phone.eq.${id},email.eq.${id}`).maybeSingle();
        if (!customer) return { error: "Customer not found" };
        const [{ data: orders }, { data: risk }] = await Promise.all([
          sb.from("orders").select("id, order_number, order_status, payment_status, total_amount, created_at").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
          sb.from("customer_risk_profiles").select("*").eq("customer_id", customer.id).maybeSingle(),
        ]);
        return { customer, orders, risk_profile: risk };
      }
      case "list_customer_types": return { customer_types: (await sb.from("customer_types").select("id, name, is_active, show_on_public_page")).data };
      case "list_reviews": {
        let q = sb.from("reviews").select("id, product_id, customer_id, rating, title, content, is_approved, created_at").order("created_at", { ascending: false }).limit(args.limit || 25);
        if (args.is_approved !== undefined) q = q.eq("is_approved", args.is_approved);
        if (args.product_id) q = q.eq("product_id", args.product_id);
        const { data, error } = await q;
        if (error) throw error;
        return { reviews: data };
      }
      case "list_inventory_products": {
        let q = sb.from("inventory_products").select("id, name, sku, current_stock, unit, purchase_price, is_active").order("name").limit(args.limit || 50);
        if (args.search) q = q.or(`name.ilike.%${args.search}%,sku.ilike.%${args.search}%`);
        const { data, error } = await q;
        if (error) throw error;
        return { inventory_products: data };
      }
      case "list_low_stock_variants": {
        const { data, error } = await sb.from("product_variants").select("id, product_id, sku, stock_quantity, low_stock_threshold, selling_price").eq("is_active", true).limit(args.limit || 50);
        if (error) throw error;
        const low = (data || []).filter((v: any) => v.stock_quantity <= (v.low_stock_threshold ?? 5));
        return { low_stock_variants: low };
      }
      case "list_inventory_entries": {
        let q = sb.from("inventory_entries").select("id, type, date, notes, created_at, account_id").order("created_at", { ascending: false }).limit(args.limit || 25);
        if (args.type) q = q.eq("type", args.type);
        const { data, error } = await q;
        if (error) throw error;
        return { entries: data };
      }
      case "list_accounts": {
        const { data, error } = await sb.from("accounts").select("id, name, current_balance, initial_balance, is_active, description").order("name");
        if (error) throw error;
        return { accounts: data };
      }
      case "list_transactions": {
        let q = sb.from("transactions").select("*").order("date", { ascending: false }).limit(args.limit || 25);
        if (args.type) q = q.eq("type", args.type);
        if (args.account_id) q = q.eq("account_id", args.account_id);
        if (args.days) q = q.gte("date", new Date(Date.now() - args.days * 86400000).toISOString().slice(0, 10));
        const { data, error } = await q;
        if (error) throw error;
        return { transactions: data };
      }
      case "list_order_payments": {
        let q = sb.from("order_payments").select("id, order_id, account_id, amount, payment_reference, recorded_at").order("recorded_at", { ascending: false }).limit(args.limit || 25);
        if (args.order_id) q = q.eq("order_id", args.order_id);
        const { data, error } = await q;
        if (error) throw error;
        return { payments: data };
      }
      case "list_promo_codes": {
        let q = sb.from("promo_codes").select("id, code, description, discount_type, discount_value, usage_count, usage_limit, is_active, expires_at, starts_at");
        if (args.is_active !== undefined) q = q.eq("is_active", args.is_active);
        const { data, error } = await q;
        if (error) throw error;
        return { promo_codes: data };
      }
      case "list_payment_methods": return { payment_methods: (await sb.from("payment_methods").select("id, name, type, is_active, instructions, account_details")).data };
      case "list_divisions": return { divisions: (await sb.from("divisions").select("id, name, is_active").order("name")).data };
      case "list_thanas": {
        let q = sb.from("thanas").select("id, name, division_id").order("name");
        if (args.division_id) q = q.eq("division_id", args.division_id);
        const { data, error } = await q;
        if (error) throw error;
        return { thanas: data };
      }
      case "get_sales_analytics": {
        const days = args.days || 30;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data: orders } = await sb.from("orders").select("total_amount, payment_status, order_status, created_at").gte("created_at", since);
        const list = orders || [];
        const paid = list.filter((o: any) => o.payment_status === "paid");
        const revenue = paid.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
        const aov = paid.length ? revenue / paid.length : 0;
        return {
          window_days: days,
          total_orders: list.length,
          paid_orders: paid.length,
          revenue_bdt: Math.round(revenue),
          average_order_value_bdt: Math.round(aov),
          cancelled: list.filter((o: any) => o.order_status === "cancelled").length,
        };
      }
      case "get_top_products": {
        const days = args.days || 30;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data } = await sb.from("order_items").select("product_id, product_name, quantity, line_total, orders!inner(created_at)").gte("orders.created_at", since).limit(2000);
        const agg: Record<string, any> = {};
        for (const it of data || []) {
          const k = it.product_id || it.product_name;
          if (!agg[k]) agg[k] = { product_id: it.product_id, name: it.product_name, qty: 0, revenue: 0 };
          agg[k].qty += Number(it.quantity || 0);
          agg[k].revenue += Number(it.line_total || 0);
        }
        const top = Object.values(agg).sort((a: any, b: any) => b.qty - a.qty).slice(0, args.limit || 10);
        return { top_products: top };
      }
      case "get_top_customers": {
        const { data } = await sb.from("orders").select("customer_id, total_amount, shipping_name").eq("payment_status", "paid").not("customer_id", "is", null);
        const agg: Record<string, any> = {};
        for (const o of data || []) {
          const k = o.customer_id;
          if (!agg[k]) agg[k] = { customer_id: k, name: o.shipping_name, orders: 0, total: 0 };
          agg[k].orders += 1;
          agg[k].total += Number(o.total_amount || 0);
        }
        const top = Object.values(agg).sort((a: any, b: any) => b.total - a.total).slice(0, args.limit || 10);
        return { top_customers: top };
      }
      case "get_site_settings": {
        const { data } = await sb.rpc("get_public_site_settings");
        return { site_settings: data?.[0] || null };
      }
      case "get_site_branding": return { branding: (await sb.from("site_branding").select("*").maybeSingle()).data };

      // ====== WRITE — Customers ======
      case "create_customer": {
        const { data, error } = await sb.from("customers").insert({
          name: args.name, phone: args.phone, email: args.email || null,
          gender: args.gender || "other", address: args.address || null,
          division_id: args.division_id || null, thana_id: args.thana_id || null,
          postal_code: args.postal_code || null, customer_type_id: args.customer_type_id || null,
          notes: args.notes || null, is_active: args.is_active ?? true,
        }).select().single();
        if (error) throw error;
        return { success: true, customer: data };
      }
      case "update_customer": {
        const { customer_id, ...patch } = args;
        const { data, error } = await sb.from("customers").update(patch).eq("id", customer_id).select().single();
        if (error) throw error;
        return { success: true, customer: data };
      }
      case "delete_customer": {
        const { error } = await sb.from("customers").delete().eq("id", args.customer_id);
        if (error) throw error;
        return { success: true };
      }
      // ====== WRITE — Orders ======
      case "update_order": {
        const { order_id, ...patch } = args;
        const { data, error } = await sb.from("orders").update(patch).eq("id", order_id).select().single();
        if (error) throw error;
        return { success: true, order: data };
      }
      case "set_order_status": {
        const { data: prev } = await sb.from("orders").select("order_status").eq("id", args.order_id).maybeSingle();
        const { data, error } = await sb.from("orders").update({ order_status: args.status }).eq("id", args.order_id).select().single();
        if (error) throw error;
        await sb.from("order_status_history").insert({
          order_id: args.order_id, status_type: "order",
          previous_status: prev?.order_status || null, new_status: args.status,
          notes: args.notes || "Updated by AI assistant",
        });
        return { success: true, order: data };
      }
      case "set_payment_status": {
        const { data: prev } = await sb.from("orders").select("payment_status").eq("id", args.order_id).maybeSingle();
        const { data, error } = await sb.from("orders").update({ payment_status: args.payment_status }).eq("id", args.order_id).select().single();
        if (error) throw error;
        await sb.from("order_status_history").insert({
          order_id: args.order_id, status_type: "payment",
          previous_status: prev?.payment_status || null, new_status: args.payment_status,
          notes: args.notes || "Updated by AI assistant",
        });
        return { success: true, order: data };
      }
      case "update_order_item": {
        if (args.delete) {
          const { error } = await sb.from("order_items").delete().eq("id", args.item_id);
          if (error) throw error;
          return { success: true, deleted: true };
        }
        const patch: any = {};
        if (args.quantity !== undefined) patch.quantity = args.quantity;
        if (args.unit_price !== undefined) patch.unit_price = args.unit_price;
        if (args.fulfillment_status) patch.fulfillment_status = args.fulfillment_status;
        if (patch.quantity !== undefined || patch.unit_price !== undefined) {
          const { data: cur } = await sb.from("order_items").select("quantity, unit_price").eq("id", args.item_id).maybeSingle();
          const qty = patch.quantity ?? cur?.quantity ?? 1;
          const price = patch.unit_price ?? cur?.unit_price ?? 0;
          patch.line_total = Number(qty) * Number(price);
        }
        const { data, error } = await sb.from("order_items").update(patch).eq("id", args.item_id).select().single();
        if (error) throw error;
        return { success: true, item: data };
      }
      case "add_order_payment": {
        const { data, error } = await sb.from("order_payments").insert({
          order_id: args.order_id, account_id: args.account_id,
          amount: args.amount, payment_reference: args.payment_reference || null,
        }).select().single();
        if (error) throw error;
        // Bump paid_amount
        const { data: o } = await sb.from("orders").select("paid_amount, total_amount").eq("id", args.order_id).maybeSingle();
        const newPaid = Number(o?.paid_amount || 0) + Number(args.amount);
        const newStatus = newPaid >= Number(o?.total_amount || 0) ? "paid" : (newPaid > 0 ? "partial" : "unpaid");
        await sb.from("orders").update({ paid_amount: newPaid, payment_status: newStatus }).eq("id", args.order_id);
        return { success: true, payment: data, new_paid_amount: newPaid, new_payment_status: newStatus };
      }
      case "delete_order": {
        await sb.from("order_items").delete().eq("order_id", args.order_id);
        await sb.from("order_status_history").delete().eq("order_id", args.order_id);
        await sb.from("order_payments").delete().eq("order_id", args.order_id);
        const { error } = await sb.from("orders").delete().eq("id", args.order_id);
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
