import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  tool_calls?: any;
  name?: string;
}

const tools = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search the product catalog by keyword (name, SKU, or description). Returns up to 20 active products with id, name, price, SKU, short description, category, brand, featured flag, and main image.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword. Use empty string to list latest products." },
          limit: { type: "number", description: "Max results (default 20, max 30)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get full details of a product by its id, slug, or name — includes all variants (color/size/material/price/stock), images, brand, category, descriptions, size guide, care instructions.",
      parameters: {
        type: "object",
        properties: { identifier: { type: "string" } },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List all product categories (with parent hierarchy). Useful for browsing or suggesting categories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "browse_by_category",
      description: "List active products in a category by category name or id. Returns up to 20 products.",
      parameters: {
        type: "object",
        properties: { category: { type: "string" }, limit: { type: "number" } },
        required: ["category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_featured_products",
      description: "Get featured/recommended products from the store. Returns up to 12 items.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "get_new_arrivals",
      description: "Get the newest active products. Returns up to 12 items by created_at desc.",
      parameters: { type: "object", properties: { limit: { type: "number" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_related_products",
      description: "Given a product id or name, suggest related products from the same category.",
      parameters: {
        type: "object",
        properties: { identifier: { type: "string" }, limit: { type: "number" } },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "filter_products",
      description: "Filter products by optional price range, category name, brand name, color name, size label. All fields optional.",
      parameters: {
        type: "object",
        properties: {
          min_price: { type: "number" },
          max_price: { type: "number" },
          category: { type: "string" },
          brand: { type: "string" },
          color: { type: "string" },
          size: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_orders",
      description: "Find a customer's orders by phone number or order number.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
          order_number: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "place_order",
      description: "Create an order. Use only after confirming items, name, phone, full address, and city.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          city: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_id: { type: "string" },
                variant_id: { type: "string" },
                quantity: { type: "number" },
              },
              required: ["product_id", "quantity"],
            },
          },
          notes: { type: "string" },
        },
        required: ["name", "phone", "address", "city", "items"],
      },
    },
  },
];

const PRODUCT_LIST_SELECT = `
  id, name, sku, base_price, short_description, is_featured,
  category:categories(id, name),
  brand:brands(id, name),
  images:product_images(image_url, is_main, sort_order)
`;

const PRODUCT_FULL_SELECT = `
  id, name, sku, base_price, short_description, full_description, is_featured, youtube_url,
  category:categories(id, name),
  brand:brands(id, name),
  size_guide:size_guides(name, content),
  care_instruction:care_instructions(name, content),
  images:product_images(image_url, is_main, sort_order, alt_text),
  variants:product_variants(id, sku, selling_price, purchase_price, stock_quantity, is_active, image_url, color:colors(name, hex_code), size:sizes(label), material:materials(name))
`;

function pickMainImage(p: any) {
  const imgs = p?.images || [];
  return imgs.find((i: any) => i.is_main)?.image_url || imgs[0]?.image_url || null;
}

function shapeProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.base_price),
    short_description: p.short_description,
    is_featured: p.is_featured,
    category: p.category?.name || null,
    brand: p.brand?.name || null,
    image: pickMainImage(p),
    url: `/product/${p.id}`,
  };
}

async function executeTool(name: string, args: any, supabase: any) {
  try {
    if (name === "search_products") {
      const limit = Math.min(Number(args.limit) || 20, 30);
      const q = (args.query || "").trim();
      let query = supabase.from("products").select(PRODUCT_LIST_SELECT).eq("is_active", true);
      if (q) {
        query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,short_description.ilike.%${q}%,full_description.ilike.%${q}%`);
      }
      const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
      if (error) return { error: error.message };
      return (data || []).map(shapeProduct);
    }

    if (name === "get_product_details") {
      const id = args.identifier;
      let { data } = await supabase.from("products").select(PRODUCT_FULL_SELECT).eq("id", id).maybeSingle();
      if (!data) {
        const r = await supabase.from("products").select(PRODUCT_FULL_SELECT)
          .or(`name.ilike.%${id}%,sku.ilike.%${id}%`).eq("is_active", true).limit(1).maybeSingle();
        data = r.data;
      }
      if (!data) return { error: "Product not found" };
      return {
        ...shapeProduct(data),
        full_description: data.full_description,
        youtube_url: data.youtube_url,
        images: (data.images || []).map((i: any) => i.image_url),
        size_guide: data.size_guide,
        care_instruction: data.care_instruction,
        variants: (data.variants || []).filter((v: any) => v.is_active).map((v: any) => ({
          id: v.id, sku: v.sku, price: Number(v.selling_price), stock: v.stock_quantity,
          color: v.color?.name, size: v.size?.label, material: v.material?.name, image: v.image_url,
        })),
      };
    }

    if (name === "list_categories") {
      const { data } = await supabase.from("categories").select("id, name, parent_id").order("sort_order");
      return data || [];
    }

    if (name === "browse_by_category") {
      const limit = Math.min(Number(args.limit) || 20, 30);
      const cat = args.category;
      const { data: catRow } = await supabase.from("categories").select("id")
        .or(`id.eq.${/^[0-9a-f-]{36}$/i.test(cat) ? cat : "00000000-0000-0000-0000-000000000000"},name.ilike.%${cat}%`).limit(1).maybeSingle();
      if (!catRow) return { error: "Category not found" };
      const { data } = await supabase.from("products").select(PRODUCT_LIST_SELECT)
        .eq("is_active", true).eq("category_id", catRow.id).order("created_at", { ascending: false }).limit(limit);
      return (data || []).map(shapeProduct);
    }

    if (name === "get_featured_products") {
      const limit = Math.min(Number(args.limit) || 12, 20);
      const { data } = await supabase.from("products").select(PRODUCT_LIST_SELECT)
        .eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(limit);
      return (data || []).map(shapeProduct);
    }

    if (name === "get_new_arrivals") {
      const limit = Math.min(Number(args.limit) || 12, 20);
      const { data } = await supabase.from("products").select(PRODUCT_LIST_SELECT)
        .eq("is_active", true).order("created_at", { ascending: false }).limit(limit);
      return (data || []).map(shapeProduct);
    }

    if (name === "suggest_related_products") {
      const id = args.identifier;
      const limit = Math.min(Number(args.limit) || 8, 20);
      let { data: prod } = await supabase.from("products").select("id, category_id").eq("id", id).maybeSingle();
      if (!prod) {
        const r = await supabase.from("products").select("id, category_id")
          .or(`name.ilike.%${id}%,sku.ilike.%${id}%`).eq("is_active", true).limit(1).maybeSingle();
        prod = r.data;
      }
      if (!prod?.category_id) return [];
      const { data } = await supabase.from("products").select(PRODUCT_LIST_SELECT)
        .eq("is_active", true).eq("category_id", prod.category_id).neq("id", prod.id)
        .order("created_at", { ascending: false }).limit(limit);
      return (data || []).map(shapeProduct);
    }

    if (name === "filter_products") {
      const limit = Math.min(Number(args.limit) || 20, 30);
      let query = supabase.from("products").select(PRODUCT_LIST_SELECT + ", variants:product_variants(selling_price, color:colors(name), size:sizes(label))")
        .eq("is_active", true);
      if (args.min_price != null) query = query.gte("base_price", args.min_price);
      if (args.max_price != null) query = query.lte("base_price", args.max_price);
      if (args.category) {
        const { data: c } = await supabase.from("categories").select("id").ilike("name", `%${args.category}%`).limit(1).maybeSingle();
        if (c) query = query.eq("category_id", c.id);
      }
      if (args.brand) {
        const { data: b } = await supabase.from("brands").select("id").ilike("name", `%${args.brand}%`).limit(1).maybeSingle();
        if (b) query = query.eq("brand_id", b.id);
      }
      const { data } = await query.order("created_at", { ascending: false }).limit(limit);
      let results = (data || []);
      if (args.color) {
        results = results.filter((p: any) => (p.variants || []).some((v: any) => v.color?.name?.toLowerCase().includes(args.color.toLowerCase())));
      }
      if (args.size) {
        results = results.filter((p: any) => (p.variants || []).some((v: any) => v.size?.label?.toLowerCase() === args.size.toLowerCase()));
      }
      return results.map(shapeProduct);
    }

    if (name === "lookup_orders") {
      const { data, error } = await supabase.rpc("track_orders_lookup", {
        p_order_number: args.order_number || null, p_phone: args.phone || null, p_email: null,
      });
      if (error) return { error: error.message };
      return data || [];
    }

    if (name === "place_order") {
      const items = [];
      let subtotal = 0;
      for (const it of args.items) {
        const { data: prod } = await supabase.from("products").select("id, name, base_price").eq("id", it.product_id).maybeSingle();
        if (!prod) continue;
        let price = Number(prod.base_price);
        let variantSku = "";
        let variantDetails: any = {};
        if (it.variant_id) {
          const { data: variant } = await supabase.from("product_variants")
            .select("sku, selling_price, color:colors(name), size:sizes(label)").eq("id", it.variant_id).maybeSingle();
          if (variant) {
            price = Number(variant.selling_price) || price;
            variantSku = variant.sku;
            variantDetails = { color: (variant.color as any)?.name, size: (variant.size as any)?.label };
          }
        }
        const qty = Number(it.quantity) || 1;
        const lineTotal = price * qty;
        subtotal += lineTotal;
        items.push({
          product_id: prod.id, variant_id: it.variant_id || null, product_name: prod.name,
          variant_sku: variantSku, variant_details: variantDetails,
          unit_price: price, quantity: qty, line_total: lineTotal,
        });
      }
      if (items.length === 0) return { error: "No valid products" };

      const { data: customerId } = await supabase.rpc("upsert_checkout_customer", {
        p_name: args.name, p_phone: args.phone, p_email: null, p_gender: "other",
        p_address: args.address, p_division_id: null, p_thana_id: null,
      });

      const { data: result, error } = await supabase.rpc("create_order_atomic", {
        p_order: {
          customer_id: customerId, guest_phone: args.phone,
          order_status: "pending", payment_status: "unpaid", payment_method_type: "cod",
          subtotal, total_amount: subtotal,
          shipping_name: args.name, shipping_phone: args.phone,
          shipping_address: args.address, shipping_city: args.city,
          customer_notes: args.notes || "Placed via chat assistant",
        },
        p_items: items,
      });
      if (error) return { error: error.message };
      return { success: true, ...result };
    }

    return { error: "Unknown tool" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, sessionId, conversationId: incomingConvId } = await req.json();

    const [{ data: settings }, { data: faqs }] = await Promise.all([
      supabase.from("chatbot_settings").select("*").maybeSingle(),
      supabase.from("chatbot_faqs").select("question, answer, image_url").eq("is_active", true).order("sort_order"),
    ]);

    if (settings && !settings.enabled) {
      return new Response(JSON.stringify({ error: "Chat is currently disabled" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let conversationId = incomingConvId;
    if (!conversationId) {
      const { data: conv } = await supabase.from("chatbot_conversations")
        .insert({ session_id: sessionId, user_agent: req.headers.get("user-agent") })
        .select("id").single();
      conversationId = conv?.id;
    }
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user" && conversationId) {
      await supabase.from("chatbot_messages").insert({
        conversation_id: conversationId, role: "user", content: lastUserMsg.content,
      });
    }

    const faqText = (faqs || []).map((f: any) => {
      const img = f.image_url ? `\nImage: ${f.image_url}` : "";
      return `Q: ${f.question}\nA: ${f.answer}${img}`;
    }).join("\n\n");
    const blocked = Array.isArray(settings?.blocked_topics) ? settings.blocked_topics : [];
    const blockedText = blocked.length ? `\n\nBlocked topics — politely refuse if asked: ${blocked.join(", ")}.` : "";

    const systemPrompt = `${settings?.system_prompt || "You are POSHPLEX's shopping assistant."}

You have FULL access to the entire POSHPLEX product catalog through tools. Always use the tools to answer product questions instead of guessing — never claim you cannot see products.

Available product tools:
- search_products — keyword search across name/SKU/description
- get_product_details — full info incl. variants, sizes, colors, stock, price
- list_categories — all categories
- browse_by_category — list products in a category
- get_featured_products / get_new_arrivals — recommendations
- suggest_related_products — similar items to a given product
- filter_products — by price range, category, brand, color, size
- lookup_orders / place_order — order operations

CRITICAL OUTPUT RULE FOR PRODUCT LISTS:
When recommending, suggesting, or listing ANY products, you MUST embed them ONLY inside a fenced code block tagged exactly \`products\`. Never write product JSON, raw arrays, or product details as plain text or markdown lists. The UI hides this block and renders an image slider in its place.

Format (use this EXACT fence tag):

\`\`\`products
[{"id":"<uuid>","name":"<name>","price":1234,"image":"<image_url>","url":"/product/<uuid>"}]
\`\`\`

Rules:
- Tag MUST be \`products\` (not \`json\`, not blank).
- Include 3–8 items. Use the exact id, name, price (number, no ৳), image URL, and url returned by the tools.
- Before the block: 1 short intro line. After the block: 1 short line inviting the customer to tap a product to order.
- Do NOT also list the same products in prose, bullets, or another code block.

Strict scope: Only discuss POSHPLEX products, orders, shipping, returns, and customer accounts. For anything else, politely say you can only help with shopping.${blockedText}

When the customer wants to buy: search_products → get_product_details → confirm choice & variant → collect name+phone+address+city → confirm full summary → call place_order.

${faqText ? "Reference FAQs:\n" + faqText : ""}`;

    const fullMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

    let finalText = "";
    let iterations = 0;
    while (iterations < 6) {
      iterations++;
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: settings?.model || "google/gemini-3-flash-preview",
          messages: fullMessages,
          tools,
        }),
      });

      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please wait a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please contact support." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!resp.ok) {
        const t = await resp.text();
        console.error("AI error", resp.status, t);
        return new Response(JSON.stringify({ error: "AI service error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const choice = data.choices?.[0]?.message;
      if (!choice) break;

      if (choice.tool_calls && choice.tool_calls.length > 0) {
        fullMessages.push(choice);
        for (const tc of choice.tool_calls) {
          let args = {};
          try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
          const result = await executeTool(tc.function.name, args, supabase);
          fullMessages.push({
            role: "tool", tool_call_id: tc.id, name: tc.function.name,
            content: JSON.stringify(result),
          } as any);
        }
        continue;
      }

      finalText = choice.content || "";
      break;
    }

    if (conversationId && finalText) {
      await supabase.from("chatbot_messages").insert({
        conversation_id: conversationId, role: "assistant", content: finalText,
      });
      await supabase.from("chatbot_conversations")
        .update({ message_count: (messages.length || 0) + 1, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return new Response(JSON.stringify({ content: finalText, conversationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
