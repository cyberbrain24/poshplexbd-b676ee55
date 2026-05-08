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
      description: "Search the product catalog by keyword. Returns up to 8 products with name, price, slug.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get full details (variants, sizes, stock) of a product by its slug or name.",
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
      description: "Create an order in the system. Use only after collecting name, phone, full address, district, thana, and product list.",
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

async function executeTool(name: string, args: any, supabase: any) {
  if (name === "search_products") {
    const { data } = await supabase
      .from("products")
      .select("id, name, base_price, sku, short_description")
      .eq("is_active", true)
      .or(`name.ilike.%${args.query}%,sku.ilike.%${args.query}%,short_description.ilike.%${args.query}%`)
      .limit(8);
    return data || [];
  }
  if (name === "get_product_details") {
    const { data } = await supabase
      .from("products")
      .select("id, name, base_price, sku, short_description, full_description, variants:product_variants(id, sku, selling_price, stock_quantity, color:colors(name), size:sizes(label))")
      .eq("is_active", true)
      .or(`name.ilike.%${args.identifier}%,sku.ilike.%${args.identifier}%`)
      .limit(1)
      .maybeSingle();
    return data || { error: "Product not found" };
  }
  if (name === "lookup_orders") {
    const { data, error } = await supabase.rpc("track_orders_lookup", {
      p_order_number: args.order_number || null,
      p_phone: args.phone || null,
      p_email: null,
    });
    if (error) return { error: error.message };
    return data || [];
  }
  if (name === "place_order") {
    const items = [];
    let subtotal = 0;
    for (const it of args.items) {
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, base_price")
        .eq("id", it.product_id)
        .maybeSingle();
      if (!prod) continue;
      let price = Number(prod.base_price);
      let variantSku = "";
      let variantDetails: any = {};
      if (it.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("sku, selling_price, color:colors(name), size:sizes(label)")
          .eq("id", it.variant_id)
          .maybeSingle();
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
        product_id: prod.id,
        variant_id: it.variant_id || null,
        product_name: prod.name,
        variant_sku: variantSku,
        variant_details: variantDetails,
        unit_price: price,
        quantity: qty,
        line_total: lineTotal,
      });
    }
    if (items.length === 0) return { error: "No valid products" };

    // Find or create customer
    const { data: customerId } = await supabase.rpc("upsert_checkout_customer", {
      p_name: args.name,
      p_phone: args.phone,
      p_email: null,
      p_gender: "other",
      p_address: args.address,
      p_division_id: null,
      p_thana_id: null,
    });

    const { data: result, error } = await supabase.rpc("create_order_atomic", {
      p_order: {
        customer_id: customerId,
        guest_phone: args.phone,
        order_status: "pending",
        payment_status: "unpaid",
        payment_method_type: "cod",
        subtotal,
        total_amount: subtotal,
        shipping_name: args.name,
        shipping_phone: args.phone,
        shipping_address: args.address,
        shipping_city: args.city,
        customer_notes: args.notes || "Placed via chat assistant",
      },
      p_items: items,
    });
    if (error) return { error: error.message };
    return { success: true, ...result };
  }
  return { error: "Unknown tool" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { messages, sessionId, conversationId: incomingConvId } = await req.json();

    // Load settings + FAQs
    const [{ data: settings }, { data: faqs }] = await Promise.all([
      supabase.from("chatbot_settings").select("*").maybeSingle(),
      supabase.from("chatbot_faqs").select("question, answer").eq("is_active", true).order("sort_order"),
    ]);

    if (settings && !settings.enabled) {
      return new Response(JSON.stringify({ error: "Chat is currently disabled" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist conversation + user message
    let conversationId = incomingConvId;
    if (!conversationId) {
      const { data: conv } = await supabase
        .from("chatbot_conversations")
        .insert({ session_id: sessionId, user_agent: req.headers.get("user-agent") })
        .select("id")
        .single();
      conversationId = conv?.id;
    }
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user" && conversationId) {
      await supabase.from("chatbot_messages").insert({
        conversation_id: conversationId, role: "user", content: lastUserMsg.content,
      });
    }

    const faqText = (faqs || []).map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    const blocked = Array.isArray(settings?.blocked_topics) ? settings.blocked_topics : [];
    const blockedText = blocked.length ? `\n\nBlocked topics — politely refuse if asked: ${blocked.join(", ")}.` : "";

    const systemPrompt = `${settings?.system_prompt || "You are a shopping assistant."}

Strict scope: Only discuss POSHPLEX products, orders, shipping, returns, and customer accounts. For anything else, politely say you can only help with shopping.${blockedText}

When the customer wants to buy something, use search_products → get_product_details → confirm choice → collect name+phone+address+city → call place_order. Always confirm the order summary before calling place_order.

${faqText ? "Reference FAQs:\n" + faqText : ""}`;

    const fullMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

    // Tool calling loop (non-streaming for simplicity with tools)
    let finalText = "";
    let iterations = 0;
    while (iterations < 5) {
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
            role: "tool",
            tool_call_id: tc.id,
            name: tc.function.name,
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
      await supabase
        .from("chatbot_conversations")
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
