// AI search suggestion edge function
// Public endpoint — corrects misspellings and finds semantically related products
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ corrected_query: null, suggested_product_ids: [], message: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch active product catalog (small enough to send fully)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, sku, short_description, category:categories(name)")
      .eq("is_active", true)
      .limit(500);

    if (error) throw error;

    const catalog = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name || null,
    }));

    const systemPrompt = `You are a search assistant for a fashion store called POSHPLEX.
Given a shopper's search query (which may contain typos, slang, or vague terms) and the full product catalog, do TWO things:

1. If the query looks misspelled or could be rephrased more clearly, set "corrected_query" to a cleaner spelling. Otherwise null.
2. From the catalog, pick up to 6 product IDs that are the most likely matches for what the shopper meant — including fuzzy/typo matches and semantically related items (e.g. "tshirt" -> t-shirts, "blk hoody" -> black hoodies).

Only suggest IDs that exist in the provided catalog. If nothing reasonable matches, return an empty array.

Catalog:
${JSON.stringify(catalog)}`;

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Shopper query: "${query.trim()}"` },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_search_suggestions",
                description: "Return search suggestions for the query.",
                parameters: {
                  type: "object",
                  properties: {
                    corrected_query: {
                      type: ["string", "null"],
                      description: "A cleaned-up spelling/phrasing or null.",
                    },
                    suggested_product_ids: {
                      type: "array",
                      items: { type: "string" },
                      description: "Up to 6 matching product UUIDs from the catalog.",
                    },
                    message: {
                      type: ["string", "null"],
                      description: "Optional short note like 'Did you mean black hoodies?'",
                    },
                  },
                  required: ["corrected_query", "suggested_product_ids", "message"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_search_suggestions" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429 || aiResp.status === 402) {
        return new Response(
          JSON.stringify({ corrected_query: null, suggested_product_ids: [], message: null }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : { corrected_query: null, suggested_product_ids: [], message: null };

    // Validate IDs against the catalog
    const validIds = new Set(catalog.map((p) => p.id));
    const filteredIds = (args.suggested_product_ids || []).filter((id: string) =>
      validIds.has(id),
    );

    return new Response(
      JSON.stringify({
        corrected_query: args.corrected_query || null,
        suggested_product_ids: filteredIds,
        message: args.message || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-search-suggest error:", e);
    return new Response(
      JSON.stringify({
        corrected_query: null,
        suggested_product_ids: [],
        message: null,
        error: e instanceof Error ? e.message : "unknown",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
