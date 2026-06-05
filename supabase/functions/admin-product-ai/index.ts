// Admin Product AI Agent — tool calling
// Read tools auto-execute; write tools require client confirmation.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODELS = ["openai/gpt-5-mini", "google/gemini-3-flash-preview"];

const READ_TOOLS = new Set([
  // Catalog
  "list_products", "get_product", "list_categories", "list_brands",
  "list_colors", "list_sizes", "list_materials", "list_size_guides",
  "list_care_instructions", "list_product_variants", "list_product_images",
  "list_product_categories",
  // Orders
  "list_orders", "get_order", "get_order_items",
  // Customers
  "list_customers", "get_customer", "list_customer_types",
  // Reviews
  "list_reviews",
  // Inventory
  "list_low_stock_variants",
  // Finance
  "list_accounts", "list_transactions", "list_order_payments",
  // Marketing
  "list_promo_codes", "list_payment_methods",
  // Locations & shipping
  "list_divisions", "list_thanas", "list_shipping_rates",
  // Variants library
  "list_custom_variants",
  // Site / Analytics
  "get_site_overview", "get_sales_analytics", "get_top_products", "get_top_customers",
  "get_site_settings", "get_site_branding",
  // SMS
  "get_sms_settings", "list_sms_templates", "list_sms_campaigns", "list_sms_messages",
  // Universal DB introspection (auto-discovers any new module)
  "db_list_tables", "db_query_table", "db_count_table",
]);


const WRITE_TOOLS = new Set([
  // Products
  "create_product", "update_product", "delete_product",
  "add_product_image", "update_product_image", "delete_product_image",
  "set_product_active", "set_product_featured",
  "create_product_variant", "update_product_variant", "delete_product_variant",
  "bulk_update_variant_prices", "bulk_update_category_prices",
  "add_product_category", "remove_product_category",
  // Customers
  "create_customer", "update_customer", "delete_customer",
  // Orders
  "update_order", "delete_order", "set_order_status", "set_payment_status",
  "update_order_item", "add_order_payment",
  // SMS Marketing
  "update_sms_settings", "update_sms_template", "create_sms_template", "delete_sms_template",
  "send_sms", "send_bulk_sms",
  // Shipping (thanas with shipping_cost)
  "create_thana", "update_thana", "delete_thana", "set_thana_shipping_cost", "bulk_set_thana_shipping_cost",
  // Custom variants
  "create_custom_variant", "update_custom_variant", "delete_custom_variant",
]);


const tools = [
  // READ
  { type: "function", function: { name: "list_products", description: "List products. Filter by search (name/SKU), category_id OR category_name (matches both legacy products.category_id AND multi-category junction), is_active. Default limit 100, max 500.", parameters: { type: "object", properties: { search: { type: "string" }, category_id: { type: "string" }, category_name: { type: "string" }, is_active: { type: "boolean" }, limit: { type: "number" } } } } },
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
    brand_id: { type: "string" }, category_id: { type: "string" }, product_type: { type: "string", description: "simple|variable" },
    youtube_url: { type: "string" }, youtube_autoplay: { type: "boolean" }, youtube_mute: { type: "boolean" },
    size_guide_id: { type: "string" }, care_instruction_id: { type: "string" },
    is_active: { type: "boolean" }, is_featured: { type: "boolean" },
  }, required: ["product_id"] } } },
  { type: "function", function: { name: "delete_product", description: "Delete a product by id (also removes its variants and images).", parameters: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } } },
  { type: "function", function: { name: "set_product_active", description: "Toggle product active status.", parameters: { type: "object", properties: { product_id: { type: "string" }, is_active: { type: "boolean" } }, required: ["product_id", "is_active"] } } },
  { type: "function", function: { name: "set_product_featured", description: "Toggle product featured status.", parameters: { type: "object", properties: { product_id: { type: "string" }, is_featured: { type: "boolean" } }, required: ["product_id", "is_featured"] } } },
  { type: "function", function: { name: "add_product_image", description: "Attach an image URL to a product.", parameters: { type: "object", properties: { product_id: { type: "string" }, image_url: { type: "string" }, is_main: { type: "boolean" }, alt_text: { type: "string" }, color_id: { type: "string" }, sort_order: { type: "number" } }, required: ["product_id", "image_url"] } } },
  { type: "function", function: { name: "update_product_image", description: "Update fields on a product image (is_main, alt_text, sort_order, color_id).", parameters: { type: "object", properties: { image_id: { type: "string" }, is_main: { type: "boolean" }, alt_text: { type: "string" }, sort_order: { type: "number" }, color_id: { type: "string" } }, required: ["image_id"] } } },
  { type: "function", function: { name: "delete_product_image", description: "Delete a product image by id.", parameters: { type: "object", properties: { image_id: { type: "string" } }, required: ["image_id"] } } },
  // Variants
  { type: "function", function: { name: "list_product_variants", description: "List variants for a product, including color/size/material names, SKU, prices, and stock.", parameters: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } } },
  { type: "function", function: { name: "list_product_images", description: "List images for a product.", parameters: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } } },
  { type: "function", function: { name: "list_product_categories", description: "List category links for a product (multi-category junction).", parameters: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } } },
  { type: "function", function: { name: "create_product_variant", description: "Create a new variant for a product. Provide product_id, sku, selling_price, and any of color_id/size_id/material_id, purchase_price, image_url, stock_quantity, low_stock_threshold, is_active.", parameters: { type: "object", properties: {
    product_id: { type: "string" }, sku: { type: "string" }, selling_price: { type: "number" }, purchase_price: { type: "number" },
    color_id: { type: "string" }, size_id: { type: "string" }, material_id: { type: "string" },
    image_url: { type: "string" }, stock_quantity: { type: "number" }, low_stock_threshold: { type: "number" }, is_active: { type: "boolean" },
  }, required: ["product_id", "sku", "selling_price"] } } },
  { type: "function", function: { name: "update_product_variant", description: "Update an existing variant by variant_id. Use this to change variation prices (selling_price / purchase_price), stock, SKU, color/size/material, image, or active state.", parameters: { type: "object", properties: {
    variant_id: { type: "string" }, sku: { type: "string" }, selling_price: { type: "number" }, purchase_price: { type: "number" },
    color_id: { type: "string" }, size_id: { type: "string" }, material_id: { type: "string" },
    image_url: { type: "string" }, stock_quantity: { type: "number" }, low_stock_threshold: { type: "number" }, is_active: { type: "boolean" },
  }, required: ["variant_id"] } } },
  { type: "function", function: { name: "delete_product_variant", description: "Delete a variant by id.", parameters: { type: "object", properties: { variant_id: { type: "string" } }, required: ["variant_id"] } } },
  { type: "function", function: { name: "bulk_update_variant_prices", description: "Update selling_price (and optionally purchase_price) for ALL variants of ONE product in a single call, AND aligns the product's base_price. Works for both simple and variable products.", parameters: { type: "object", properties: {
    product_id: { type: "string" }, selling_price: { type: "number" }, purchase_price: { type: "number" },
  }, required: ["product_id", "selling_price"] } } },
  { type: "function", function: { name: "bulk_update_category_prices", description: "Change selling_price for ALL products in a category in one call. Updates products.base_price for every matched product (so simple products work) AND product_variants.selling_price for variants. Pass either category_id or category_name. Use this when admin says 'change all products in <category> to <price>'. Matches both legacy products.category_id AND multi-category junction.", parameters: { type: "object", properties: {
    category_id: { type: "string" }, category_name: { type: "string" },
    selling_price: { type: "number" }, purchase_price: { type: "number" },
  }, required: ["selling_price"] } } },
  { type: "function", function: { name: "add_product_category", description: "Link an additional category to a product (multi-category support).", parameters: { type: "object", properties: { product_id: { type: "string" }, category_id: { type: "string" } }, required: ["product_id", "category_id"] } } },
  { type: "function", function: { name: "remove_product_category", description: "Remove a category link from a product.", parameters: { type: "object", properties: { product_id: { type: "string" }, category_id: { type: "string" } }, required: ["product_id", "category_id"] } } },
  { type: "function", function: { name: "list_orders", description: "List recent orders with optional filters.", parameters: { type: "object", properties: { status: { type: "string", description: "pending|confirmed|shipped|delivered|cancelled|partially_delivered" }, payment_status: { type: "string", description: "unpaid|partial|paid|refunded" }, search: { type: "string", description: "Order number or customer phone" }, limit: { type: "number" }, days: { type: "number", description: "Only orders from last N days" } } } } },
  { type: "function", function: { name: "get_order", description: "Get full order details by order_number or id.", parameters: { type: "object", properties: { identifier: { type: "string" } }, required: ["identifier"] } } },
  { type: "function", function: { name: "get_order_items", description: "List items for an order id.", parameters: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] } } },
  { type: "function", function: { name: "list_customers", description: "List customers, optional search by name/phone/email.", parameters: { type: "object", properties: { search: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "get_customer", description: "Get customer details + order history by id, phone, or email.", parameters: { type: "object", properties: { identifier: { type: "string" } }, required: ["identifier"] } } },
  { type: "function", function: { name: "list_customer_types", description: "List membership/customer types.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_reviews", description: "List reviews. Filter by approval status or product.", parameters: { type: "object", properties: { is_approved: { type: "boolean" }, product_id: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_low_stock_variants", description: "Catalog product variants below their low_stock_threshold.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_accounts", description: "List financial accounts with current balances.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_transactions", description: "Recent finance transactions (income/expense/transfer).", parameters: { type: "object", properties: { type: { type: "string" }, account_id: { type: "string" }, limit: { type: "number" }, days: { type: "number" } } } } },
  { type: "function", function: { name: "list_order_payments", description: "Recent payments recorded against orders.", parameters: { type: "object", properties: { order_id: { type: "string" }, limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_promo_codes", description: "List promo codes with usage.", parameters: { type: "object", properties: { is_active: { type: "boolean" } } } } },
  { type: "function", function: { name: "list_payment_methods", description: "List configured payment methods.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_divisions", description: "List shipping divisions/districts.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_thanas", description: "List thanas (delivery zones) with shipping_cost, optionally filter by division.", parameters: { type: "object", properties: { division_id: { type: "string" } } } } },
  { type: "function", function: { name: "list_shipping_rates", description: "List delivery/shipping charges per thana. Optional filter by division_id or search by thana name.", parameters: { type: "object", properties: { division_id: { type: "string" }, search: { type: "string" } } } } },
  { type: "function", function: { name: "list_custom_variants", description: "List custom variant attributes (global library, e.g. fit, style).", parameters: { type: "object", properties: { is_active: { type: "boolean" } } } } },
  { type: "function", function: { name: "create_thana", description: "Create a new thana (delivery zone) under a division with a shipping_cost.", parameters: { type: "object", properties: { name: { type: "string" }, division_id: { type: "string" }, shipping_cost: { type: "number" }, is_active: { type: "boolean" } }, required: ["name", "division_id"] } } },
  { type: "function", function: { name: "update_thana", description: "Update a thana: name, division, shipping_cost, is_active.", parameters: { type: "object", properties: { thana_id: { type: "string" }, name: { type: "string" }, division_id: { type: "string" }, shipping_cost: { type: "number" }, is_active: { type: "boolean" } }, required: ["thana_id"] } } },
  { type: "function", function: { name: "delete_thana", description: "Delete a thana by id.", parameters: { type: "object", properties: { thana_id: { type: "string" } }, required: ["thana_id"] } } },
  { type: "function", function: { name: "set_thana_shipping_cost", description: "Set the delivery charge (shipping_cost) for one thana. Identify by thana_id OR thana_name (+ optional division_id).", parameters: { type: "object", properties: { thana_id: { type: "string" }, thana_name: { type: "string" }, division_id: { type: "string" }, shipping_cost: { type: "number" } }, required: ["shipping_cost"] } } },
  { type: "function", function: { name: "bulk_set_thana_shipping_cost", description: "Set the same shipping_cost for many thanas at once. Scope by division_id, or pass thana_ids, or omit both to apply to ALL thanas.", parameters: { type: "object", properties: { shipping_cost: { type: "number" }, division_id: { type: "string" }, thana_ids: { type: "array", items: { type: "string" } } }, required: ["shipping_cost"] } } },
  { type: "function", function: { name: "create_custom_variant", description: "Create a custom variant attribute in the global library.", parameters: { type: "object", properties: { label: { type: "string" }, sort_order: { type: "number" }, is_active: { type: "boolean" } }, required: ["label"] } } },
  { type: "function", function: { name: "update_custom_variant", description: "Update a custom variant.", parameters: { type: "object", properties: { custom_variant_id: { type: "string" }, label: { type: "string" }, sort_order: { type: "number" }, is_active: { type: "boolean" } }, required: ["custom_variant_id"] } } },
  { type: "function", function: { name: "delete_custom_variant", description: "Delete a custom variant.", parameters: { type: "object", properties: { custom_variant_id: { type: "string" } }, required: ["custom_variant_id"] } } },

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


  // ====== SMS Marketing ======
  { type: "function", function: { name: "get_sms_settings", description: "Get the SMS provider settings: endpoint URL, sender ID, enabled flag, request template.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_sms_templates", description: "List SMS templates (account_created, order_placed, order_shipped, order_delivered, custom). Returns id, event_key, name, body, enabled.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_sms_campaigns", description: "List recent bulk SMS campaigns with name, recipient/sent/failed counts, status, date.", parameters: { type: "object", properties: { limit: { type: "number" } } } } },
  { type: "function", function: { name: "list_sms_messages", description: "List individual SMS send log. Optional filter by status (sent|failed|pending) or trigger_event.", parameters: { type: "object", properties: { limit: { type: "number" }, status: { type: "string" }, trigger_event: { type: "string" } } } } },
  { type: "function", function: { name: "update_sms_settings", description: "Update SMS provider settings. Pass any subset: provider_name, endpoint_url, http_method (GET/POST), request_template (JSON), headers (JSON), api_key, sender_id, success_keyword, enabled, notes.", parameters: { type: "object", properties: {
    provider_name: { type: "string" }, endpoint_url: { type: "string" }, http_method: { type: "string" },
    request_template: { type: "object" }, headers: { type: "object" },
    api_key: { type: "string" }, sender_id: { type: "string" },
    success_keyword: { type: "string" }, enabled: { type: "boolean" }, notes: { type: "string" },
  } } } },
  { type: "function", function: { name: "update_sms_template", description: "Update an SMS template by event_key (account_created/order_placed/order_shipped/order_delivered or a custom slug). Pass body (with {name},{phone},{order_number},{total},{tracking} placeholders), enabled, name.", parameters: { type: "object", properties: {
    event_key: { type: "string" }, body: { type: "string" }, enabled: { type: "boolean" }, name: { type: "string" },
  }, required: ["event_key"] } } },
  { type: "function", function: { name: "create_sms_template", description: "Create a new custom SMS template. Provide a unique event_key slug, name, body, enabled.", parameters: { type: "object", properties: {
    event_key: { type: "string" }, name: { type: "string" }, body: { type: "string" }, enabled: { type: "boolean" },
  }, required: ["event_key", "name", "body"] } } },
  { type: "function", function: { name: "delete_sms_template", description: "Delete a custom (non-system) SMS template by event_key.", parameters: { type: "object", properties: { event_key: { type: "string" } }, required: ["event_key"] } } },
  { type: "function", function: { name: "send_sms", description: "Send a one-off SMS to a single phone number now.", parameters: { type: "object", properties: {
    phone: { type: "string" }, message: { type: "string" },
  }, required: ["phone", "message"] } } },
  { type: "function", function: { name: "send_bulk_sms", description: "Run a bulk SMS campaign. audience_filter is one of: {type:'all'} | {type:'membership',ids:[customer_type_id...]} | {type:'division',ids:[division_id...]} | {type:'thana',ids:[thana_id...]} | {type:'manual',phones:[]}. Body supports {name},{phone}.", parameters: { type: "object", properties: {
    name: { type: "string" }, message: { type: "string" }, audience_filter: { type: "object" },
  }, required: ["message"] } } },
  // UNIVERSAL DB ACCESS — works for ANY current or future module/table in the public schema
  { type: "function", function: { name: "db_list_tables", description: "List EVERY table in the database with all columns (name, type, nullable, default). Use this first to discover any module — including newly added ones — when you don't already have a dedicated tool for it.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "db_query_table", description: "Read rows from ANY public table. Use only when no dedicated list_/get_ tool exists for that module. Args: table (required), columns (default '*'), filters (object of column=value equals matches), search (object {column,value} for ilike), order_by, ascending, limit (default 25, max 200).", parameters: { type: "object", properties: {
    table: { type: "string" }, columns: { type: "string" }, filters: { type: "object" },
    search: { type: "object" }, order_by: { type: "string" }, ascending: { type: "boolean" }, limit: { type: "number" },
  }, required: ["table"] } } },
  { type: "function", function: { name: "db_count_table", description: "Count rows in any public table with optional equality filters.", parameters: { type: "object", properties: {
    table: { type: "string" }, filters: { type: "object" },
  }, required: ["table"] } } },
];

const SYSTEM_PROMPT = `You are POSHPLEX's admin AI assistant. The brand is a Bangladesh streetwear store ("BE POSH WITH POSHPLEX"). Currency is Taka (৳), locale en-BD.

You have READ access to EVERY module of the system: products, orders, customers, reviews, inventory, financial accounts, transactions, payments, promo codes, payment methods, shipping locations (Districts/Thanas), site settings, analytics, and SMS. Use the appropriate tool to look up real data — never guess numbers.

UNIVERSAL DATABASE ACCESS: For ANY module or table that does not have a dedicated tool (including newly created modules added later), use db_list_tables to discover the full schema, then db_query_table / db_count_table to read its data. Always prefer the dedicated tool when one exists. When the admin asks "what tables / modules do you have access to?", call db_list_tables.

You have WRITE access to: PRODUCTS — full control: create / update / delete products; manage VARIANTS (create / update / delete / bulk price update — this is how you change variation selling_price or purchase_price); manage IMAGES (add / update is_main, sort_order, alt_text, color_id / delete); manage multi-CATEGORY links (add_product_category / remove_product_category); toggle active/featured; update YouTube, size guide, care instruction. CUSTOMERS (create/update/delete), ORDERS (update fields, change status, change payment status, edit/delete items, record payments, delete order). For other modules (finance accounts, inventory entries, promo codes, etc.) explain what you see and tell the admin to use that admin page.

VARIANT PRICING: When admin asks to change a single variant price, use update_product_variant. For ALL variants of ONE product, use bulk_update_variant_prices (also aligns base_price). For ALL products in a CATEGORY (e.g. "change every product in Upper Wear to 799"), ALWAYS use bulk_update_category_prices in a SINGLE call — never loop product-by-product. It updates both products.base_price AND every variant's selling_price, covering simple products too. Use list_products with category_name only if you need to preview the affected items first.


When the admin asks to change a customer or order, first look it up by phone/email/order_number to get the id, then call the right write tool. Always confirm the destructive action briefly after it runs.

Rules:
- Always look up real data with tools before answering. Don't fabricate.
- Prefer narrow queries: use search/filters and small limits when scanning a module.
- For dates use ISO; format Taka as ৳ in user-facing replies.
- Be terse. Use markdown lists/tables when helpful.
- For prices in DB, never include the ৳ symbol.
- When creating products, default product_type to "simple" unless variants are mentioned.
- NEVER invent UUIDs. Before calling create_product_variant / update_product (with brand_id, category_id, size_guide_id, care_instruction_id) you MUST first call the matching list_* tool (list_colors, list_sizes, list_materials, list_brands, list_categories, list_size_guides, list_care_instructions) and use the real id from the response. The sizes tool returns rows with a 'label' field (e.g. M, L, XL) — match by label, not by name.
- When creating multiple variants for one product (e.g. one color × several sizes), call create_product_variant once per combination and WAIT for each tool result. Do not summarize success until every call returned success:true. If any call errors, report the failure and stop — do not pretend it succeeded.
- After making any change, briefly confirm what changed.

Modules summary:
- Products: catalog with variants, images, categories (junction), brands, colors, sizes, materials, size guides, care instructions.
- Orders: PO-XXXXX numbers, status (pending/confirmed/shipped/delivered/...), payment_status (unpaid/partial/paid/refunded), Steadfast courier integration.
- Customers: linked to auth via customer_accounts; have phone, email, division/thana, customer_type (membership).
- Inventory: product_variants stock_quantity for the catalog.
- Finance: accounts (balances), transactions (income/expense/transfer), order_payments (linked to orders).
- Marketing: promo_codes, payment_methods (COD, Mobile Banking).
- Locations: divisions (districts) -> thanas (delivery zones).`;

async function executeTool(name: string, args: any, sb: any) {
  try {
    switch (name) {
      case "list_products": {
        const limit = Math.min(args.limit || 100, 500);
        // Resolve category by name if provided
        let categoryIds: string[] | null = null;
        if (args.category_id) {
          categoryIds = [args.category_id];
        } else if (args.category_name) {
          const { data: cats } = await sb.from("categories").select("id").ilike("name", `%${args.category_name}%`);
          categoryIds = (cats || []).map((c: any) => c.id);
          if (categoryIds.length === 0) return { products: [], note: `No category matched "${args.category_name}"` };
        }
        let productIds: string[] | null = null;
        if (categoryIds) {
          // Look in BOTH legacy products.category_id AND junction product_categories
          const [{ data: viaJunction }, { data: viaLegacy }] = await Promise.all([
            sb.from("product_categories").select("product_id").in("category_id", categoryIds),
            sb.from("products").select("id").in("category_id", categoryIds),
          ]);
          productIds = Array.from(new Set([
            ...(viaJunction || []).map((r: any) => r.product_id),
            ...(viaLegacy || []).map((r: any) => r.id),
          ]));
          if (productIds.length === 0) return { products: [], note: "No products in that category" };
        }
        let q = sb.from("products").select("id, name, sku, base_price, is_active, is_featured, product_type, category_id").limit(limit).order("created_at", { ascending: false });
        if (productIds) q = q.in("id", productIds);
        if (args.search) q = q.or(`name.ilike.%${args.search}%,sku.ilike.%${args.search}%`);
        if (args.is_active !== undefined) q = q.eq("is_active", args.is_active);
        const { data, error } = await q;
        if (error) throw error;
        return { products: data, count: data?.length || 0 };
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
      case "list_sizes": return { sizes: (await sb.from("sizes").select("id, label, sort_order").order("sort_order")).data };
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
        await sb.from("product_images").delete().eq("product_id", args.product_id);
        await sb.from("product_variants").delete().eq("product_id", args.product_id);
        await sb.from("product_categories").delete().eq("product_id", args.product_id);
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
          color_id: args.color_id || null, sort_order: args.sort_order ?? 0,
        }).select().single();
        if (error) throw error;
        return { success: true, image: data };
      }
      case "update_product_image": {
        const { image_id, ...patch } = args;
        const { data, error } = await sb.from("product_images").update(patch).eq("id", image_id).select().single();
        if (error) throw error;
        return { success: true, image: data };
      }
      case "delete_product_image": {
        const { error } = await sb.from("product_images").delete().eq("id", args.image_id);
        if (error) throw error;
        return { success: true };
      }
      case "list_product_variants": {
        const { data, error } = await sb.from("product_variants").select(`
          id, sku, selling_price, purchase_price, stock_quantity, low_stock_threshold, is_active, image_url,
          color:colors(id, name, hex_code), size:sizes(id, label), material:materials(id, name)
        `).eq("product_id", args.product_id).order("created_at");
        if (error) throw error;
        return { variants: data };
      }
      case "list_product_images": {
        const { data, error } = await sb.from("product_images").select("id, image_url, alt_text, is_main, sort_order, color_id").eq("product_id", args.product_id).order("sort_order");
        if (error) throw error;
        return { images: data };
      }
      case "list_product_categories": {
        const { data, error } = await sb.from("product_categories").select("id, category_id, category:categories(id, name)").eq("product_id", args.product_id);
        if (error) throw error;
        return { product_categories: data };
      }
      case "create_product_variant": {
        const { product_id, ...rest } = args;
        const { data, error } = await sb.from("product_variants").insert({
          product_id,
          sku: rest.sku,
          selling_price: rest.selling_price,
          purchase_price: rest.purchase_price ?? 0,
          color_id: rest.color_id || null,
          size_id: rest.size_id || null,
          material_id: rest.material_id || null,
          image_url: rest.image_url || null,
          stock_quantity: rest.stock_quantity ?? 0,
          low_stock_threshold: rest.low_stock_threshold ?? 5,
          is_active: rest.is_active ?? true,
        }).select().single();
        if (error) throw error;
        return { success: true, variant: data };
      }
      case "update_product_variant": {
        const { variant_id, ...patch } = args;
        const { data, error } = await sb.from("product_variants").update(patch).eq("id", variant_id).select().single();
        if (error) throw error;
        return { success: true, variant: data };
      }
      case "delete_product_variant": {
        const { error } = await sb.from("product_variants").delete().eq("id", args.variant_id);
        if (error) throw error;
        return { success: true };
      }
      case "bulk_update_variant_prices": {
        const variantPatch: any = { selling_price: args.selling_price };
        if (args.purchase_price !== undefined) variantPatch.purchase_price = args.purchase_price;
        const { data: variants, error: vErr } = await sb.from("product_variants").update(variantPatch).eq("product_id", args.product_id).select("id, sku, selling_price, purchase_price");
        if (vErr) throw vErr;
        // Also keep product.base_price aligned so simple products and storefront price displays update too
        const productPatch: any = { base_price: args.selling_price };
        const { error: pErr } = await sb.from("products").update(productPatch).eq("id", args.product_id);
        if (pErr) throw pErr;
        return { success: true, updated_variant_count: variants?.length || 0, base_price_updated: true, variants };
      }
      case "bulk_update_category_prices": {
        // High-level: change selling_price for ALL products in a category (by id or name).
        // Updates products.base_price for every matched product AND product_variants.selling_price for variants.
        let categoryIds: string[] = [];
        if (args.category_id) categoryIds = [args.category_id];
        else if (args.category_name) {
          const { data: cats } = await sb.from("categories").select("id, name").ilike("name", `%${args.category_name}%`);
          categoryIds = (cats || []).map((c: any) => c.id);
          if (categoryIds.length === 0) return { error: `No category matched "${args.category_name}"` };
        } else {
          return { error: "Provide category_id or category_name" };
        }
        const [{ data: viaJunction }, { data: viaLegacy }] = await Promise.all([
          sb.from("product_categories").select("product_id").in("category_id", categoryIds),
          sb.from("products").select("id").in("category_id", categoryIds),
        ]);
        const productIds = Array.from(new Set([
          ...(viaJunction || []).map((r: any) => r.product_id),
          ...(viaLegacy || []).map((r: any) => r.id),
        ]));
        if (productIds.length === 0) return { success: true, updated_products: 0, updated_variants: 0, note: "No products in that category" };

        const productPatch: any = { base_price: args.selling_price };
        const { data: prodRows, error: pErr } = await sb.from("products").update(productPatch).in("id", productIds).select("id, name");
        if (pErr) throw pErr;

        const variantPatch: any = { selling_price: args.selling_price };
        if (args.purchase_price !== undefined) variantPatch.purchase_price = args.purchase_price;
        const { data: varRows, error: vErr } = await sb.from("product_variants").update(variantPatch).in("product_id", productIds).select("id");
        if (vErr) throw vErr;

        return { success: true, updated_products: prodRows?.length || 0, updated_variants: varRows?.length || 0, product_ids: productIds };
      }
      case "add_product_category": {
        const { data, error } = await sb.from("product_categories").insert({ product_id: args.product_id, category_id: args.category_id }).select().single();
        if (error) throw error;
        return { success: true, link: data };
      }
      case "remove_product_category": {
        const { error } = await sb.from("product_categories").delete().eq("product_id", args.product_id).eq("category_id", args.category_id);
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
      case "list_low_stock_variants": {
        const { data, error } = await sb.from("product_variants").select("id, product_id, sku, stock_quantity, low_stock_threshold, selling_price").eq("is_active", true).limit(args.limit || 50);
        if (error) throw error;
        const low = (data || []).filter((v: any) => v.stock_quantity <= (v.low_stock_threshold ?? 5));
        return { low_stock_variants: low };
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

      // ====== SMS Marketing ======
      case "get_sms_settings": {
        const { data } = await sb.from("sms_provider_settings").select("*").limit(1).maybeSingle();
        if (data && data.api_key) data.api_key = data.api_key.length > 4 ? `***${data.api_key.slice(-4)}` : "***";
        return { settings: data };
      }
      case "list_sms_templates": {
        const { data, error } = await sb.from("sms_templates").select("*").order("event_key");
        if (error) throw error;
        return { templates: data };
      }
      case "list_sms_campaigns": {
        const { data, error } = await sb.from("sms_campaigns").select("*").order("created_at", { ascending: false }).limit(args.limit || 25);
        if (error) throw error;
        return { campaigns: data };
      }
      case "list_sms_messages": {
        let q = sb.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(args.limit || 50);
        if (args.status) q = q.eq("status", args.status);
        if (args.trigger_event) q = q.eq("trigger_event", args.trigger_event);
        const { data, error } = await q;
        if (error) throw error;
        return { messages: data };
      }
      case "update_sms_settings": {
        const patch: any = {};
        for (const k of ["provider_name","endpoint_url","http_method","request_template","headers","api_key","sender_id","success_keyword","enabled","notes"]) {
          if (args[k] !== undefined) patch[k] = args[k];
        }
        patch.updated_at = new Date().toISOString();
        const { data: existing } = await sb.from("sms_provider_settings").select("id").limit(1).maybeSingle();
        if (existing?.id) {
          const { data, error } = await sb.from("sms_provider_settings").update(patch).eq("id", existing.id).select().single();
          if (error) throw error;
          return { success: true, settings: data };
        }
        const { data, error } = await sb.from("sms_provider_settings").insert(patch).select().single();
        if (error) throw error;
        return { success: true, settings: data };
      }
      case "update_sms_template": {
        const { event_key, ...patch } = args;
        const { data: existing } = await sb.from("sms_templates").select("id").eq("event_key", event_key).maybeSingle();
        if (!existing) return { error: `Template not found for event_key: ${event_key}` };
        const { data, error } = await sb.from("sms_templates").update(patch).eq("id", existing.id).select().single();
        if (error) throw error;
        return { success: true, template: data };
      }
      case "create_sms_template": {
        const { data, error } = await sb.from("sms_templates").insert({
          event_key: args.event_key, name: args.name, body: args.body,
          enabled: args.enabled ?? true, is_system: false,
        }).select().single();
        if (error) throw error;
        return { success: true, template: data };
      }
      case "delete_sms_template": {
        const { data: tpl } = await sb.from("sms_templates").select("id, is_system").eq("event_key", args.event_key).maybeSingle();
        if (!tpl) return { error: "Template not found" };
        if (tpl.is_system) return { error: "Cannot delete a system template; you can disable it instead." };
        const { error } = await sb.from("sms_templates").delete().eq("id", tpl.id);
        if (error) throw error;
        return { success: true };
      }
      case "send_sms": {
        const { sendSmsViaProvider } = await import("../_shared/sms.ts");
        const result = await sendSmsViaProvider(sb, args.phone, args.message);
        await sb.from("sms_messages").insert({
          phone: args.phone, body: args.message, status: result.status,
          provider_response: result.response, trigger_event: "ai",
          sent_at: result.success ? new Date().toISOString() : null,
        });
        return result;
      }
      case "send_bulk_sms": {
        // Run via service role: resolve audience + send
        const filter = args.audience_filter || { type: "all" };
        const message = args.message;
        let recipients: { phone: string; customer_id?: string; name?: string }[] = [];
        if (filter.type === "manual") {
          recipients = (filter.phones || []).map((p: string) => ({ phone: String(p).trim() })).filter((r: any) => r.phone);
        } else {
          let q = sb.from("customers").select("id, name, phone").not("phone", "is", null).eq("is_active", true);
          if (filter.type === "membership" && filter.ids?.length) q = q.in("customer_type_id", filter.ids);
          else if (filter.type === "division" && filter.ids?.length) q = q.in("division_id", filter.ids);
          else if (filter.type === "thana" && filter.ids?.length) q = q.in("thana_id", filter.ids);
          const { data } = await q.limit(10000);
          recipients = (data || []).map((c: any) => ({ phone: c.phone, customer_id: c.id, name: c.name }));
        }
        if (!recipients.length) return { error: "No recipients matched the filter" };
        const { data: campaign } = await sb.from("sms_campaigns").insert({
          name: args.name || `AI Campaign ${new Date().toISOString()}`,
          body: message, audience_filter: filter, recipient_count: recipients.length, status: "sending",
        }).select().single();
        const { sendSmsViaProvider, renderTemplate } = await import("../_shared/sms.ts");
        let sent = 0, failed = 0;
        for (const r of recipients) {
          const personalised = renderTemplate(message, { name: r.name || "", phone: r.phone });
          const res = await sendSmsViaProvider(sb, r.phone, personalised);
          await sb.from("sms_messages").insert({
            phone: r.phone, body: personalised, status: res.status, provider_response: res.response,
            customer_id: r.customer_id || null, campaign_id: campaign?.id || null, trigger_event: "bulk",
            sent_at: res.success ? new Date().toISOString() : null,
          });
          if (res.success) sent++; else failed++;
        }
        if (campaign?.id) await sb.from("sms_campaigns").update({ sent_count: sent, failed_count: failed, status: "completed", completed_at: new Date().toISOString() }).eq("id", campaign.id);
        return { success: true, recipients: recipients.length, sent, failed, campaign_id: campaign?.id };
      }

      // ===== UNIVERSAL DB ACCESS =====
      case "db_list_tables": {
        const { data, error } = await sb.rpc("admin_list_schema");
        if (error) throw error;
        return { tables: data };
      }
      case "db_query_table": {
        const table = String(args.table || "").trim();
        if (!table || !/^[a-z_][a-z0-9_]*$/i.test(table)) return { error: "Invalid table name" };
        const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 200);
        let q = sb.from(table).select(args.columns || "*").limit(limit);
        if (args.filters && typeof args.filters === "object") {
          for (const [k, v] of Object.entries(args.filters)) {
            if (v === null) q = q.is(k, null); else q = q.eq(k, v as any);
          }
        }
        if (args.search?.column && args.search?.value) {
          q = q.ilike(args.search.column, `%${args.search.value}%`);
        }
        if (args.order_by) q = q.order(args.order_by, { ascending: args.ascending !== false });
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { rows: data, count: data?.length || 0 };
      }
      case "db_count_table": {
        const table = String(args.table || "").trim();
        if (!table || !/^[a-z_][a-z0-9_]*$/i.test(table)) return { error: "Invalid table name" };
        let q = sb.from(table).select("*", { count: "exact", head: true });
        if (args.filters && typeof args.filters === "object") {
          for (const [k, v] of Object.entries(args.filters)) {
            if (v === null) q = q.is(k, null); else q = q.eq(k, v as any);
          }
        }
        const { count, error } = await q;
        if (error) return { error: error.message };
        return { count };
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
    const autoApproveWrites = body.auto_approve_writes === true; // bulk mode: auto-execute writes without per-call confirmation

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

    // Gemini's OpenAI-compat endpoint rejects null strings in message/tool-call history.
    const sanitize = (arr: any[]) => arr.map((m) => {
      const next: any = { ...m, content: typeof m.content === "string" ? m.content : m.content == null ? "" : JSON.stringify(m.content) };
      if (Array.isArray(m.tool_calls)) {
        next.tool_calls = m.tool_calls.map((call: any) => ({
          ...call,
          id: typeof call?.id === "string" ? call.id : String(call?.id || crypto.randomUUID()),
          type: "function",
          function: {
            name: typeof call?.function?.name === "string" ? call.function.name : "unknown_tool",
            arguments: typeof call?.function?.arguments === "string"
              ? call.function.arguments
              : JSON.stringify(call?.function?.arguments || {}),
          },
        }));
      }
      if (next.role === "tool" && typeof next.tool_call_id !== "string") next.tool_call_id = String(next.tool_call_id || "");
      return next;
    });

    for (let i = 0; i < 30; i++) {
      const aiResp = await callAI({ messages: sanitize(convo), tools, tool_choice: "auto" });

      if (!aiResp.ok) {
        const txt = await aiResp.text();
        if (aiResp.status === 429) return jsonResp({ error: "Rate limit. Try again in a moment." }, 429);
        if (aiResp.status === 402) return jsonResp({ error: "AI credits exhausted. Add credits in workspace settings." }, 402);
        console.error("AI error", aiResp.status, txt);
        return jsonResp({ error: "AI Agent is temporarily unavailable. Please try again." }, 200);
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
          if (autoApproveWrites) {
            // Bulk mode: execute write tool immediately without stopping for confirmation
            const result = await executeTool(name, args, sb);
            convo.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
            continue;
          }
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

async function callAI(body: any): Promise<Response> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "AI key is not configured" }), { status: 503 });
  }

  let lastResp: Response | null = null;
  for (const model of AI_MODELS) {
    const resp = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, model }),
    });
    if (resp.ok) return resp;

    const errorText = await resp.clone().text().catch(() => "");
    console.error(`AI model ${model} error`, resp.status, errorText);
    lastResp = resp;

    if (resp.status === 402 || resp.status === 429) return resp;
  }
  return lastResp || new Response(JSON.stringify({ error: "AI unavailable" }), { status: 503 });
}
