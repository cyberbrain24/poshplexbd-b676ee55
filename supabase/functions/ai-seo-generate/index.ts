import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  type: 'product_description' | 'blog_content' | 'meta_tags' | 'blog_excerpt';
  context: {
    name?: string;
    category?: string;
    brand?: string;
    title?: string;
    content?: string;
    focus_keyword?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, context } = await req.json() as GenerateRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `You are a copywriter for Poshplex, a premium streetwear fashion brand. 
Your tone is: Minimal, Hype, Streetwear, Gen-Z focused. 
No corporate jargon. Be authentic, cool, and engaging.
Always respond in the requested format without any preamble or explanation.`;

    let userPrompt = '';

    switch (type) {
      case 'product_description':
        userPrompt = `Generate a product description for:
Product: ${context.name}
Category: ${context.category || 'Streetwear'}
Brand: ${context.brand || 'Poshplex'}

Write a compelling, hype-worthy description (2-3 short paragraphs). 
Focus on the vibe, the aesthetic, and why this piece is a must-have.
Use streetwear culture references. Make it feel exclusive.`;
        break;

      case 'blog_content':
        userPrompt = `Generate blog content for:
Title: ${context.title}
Focus Keyword: ${context.focus_keyword || 'streetwear'}

Write an engaging blog post (500-700 words) in HTML format.
Use proper heading tags (h2, h3), paragraphs, and occasional bold text.
Make it shareable, informative, and aligned with streetwear culture.
Include the focus keyword naturally 3-5 times.
Output only the HTML content, no wrapper tags.`;
        break;

      case 'meta_tags':
        userPrompt = `Generate SEO meta tags for:
Title: ${context.title}
Content Preview: ${context.content?.substring(0, 500) || ''}
Focus Keyword: ${context.focus_keyword || 'streetwear fashion'}

Respond in exactly this JSON format:
{
  "meta_title": "Title under 60 characters with keyword",
  "meta_description": "Description under 160 characters, compelling and SEO-friendly"
}`;
        break;

      case 'blog_excerpt':
        userPrompt = `Generate a blog excerpt for:
Title: ${context.title}
Content: ${context.content?.substring(0, 1000) || ''}

Write a compelling 2-3 sentence excerpt that hooks the reader.
Make them want to read more. Keep it under 160 characters.
Output only the excerpt text.`;
        break;

      default:
        throw new Error('Invalid generation type');
    }

    console.log(`AI SEO Generate: Processing ${type} request for user ${userId}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';

    console.log(`AI SEO Generate: Successfully generated ${type} content for user ${userId}`);

    // Parse JSON response for meta_tags type
    let result = generatedText;
    if (type === 'meta_tags') {
      try {
        // Extract JSON from potential markdown code blocks
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse meta tags JSON:", e);
        result = { meta_title: '', meta_description: '' };
      }
    }

    return new Response(
      JSON.stringify({ result, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI SEO Generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
