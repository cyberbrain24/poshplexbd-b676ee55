import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("meta_pixel_id, meta_capi_enabled, meta_capi_access_token")
      .limit(1)
      .maybeSingle();

    if (!settings?.meta_capi_enabled || !settings?.meta_capi_access_token || !settings?.meta_pixel_id) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event_name, event_id, value, currency, contents, order_id } = body;

    const eventData = {
      data: [
        {
          event_name: event_name || "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id,
          action_source: "website",
          custom_data: {
            value: value || 0,
            currency: currency || "BDT",
            content_type: "product",
            contents: contents || [],
            order_id: order_id || "",
          },
        },
      ],
    };

    const pixelId = settings.meta_pixel_id;
    const accessToken = settings.meta_capi_access_token;

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      }
    );

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Fail silently — do not break checkout
    return new Response(JSON.stringify({ error: "CAPI call failed" }), {
      status: 200, // Return 200 to not trigger client-side errors
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
