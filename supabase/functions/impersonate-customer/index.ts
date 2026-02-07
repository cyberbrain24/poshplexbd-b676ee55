import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify caller is admin using their token
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customerId } = await req.json();
    if (!customerId) {
      return new Response(JSON.stringify({ error: "Customer ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the customer account
    const { data: customerAccount, error: accountError } = await supabaseAdmin
      .from("customer_accounts")
      .select("auth_user_id, phone, email")
      .eq("customer_id", customerId)
      .single();

    if (accountError || !customerAccount) {
      return new Response(JSON.stringify({ error: "Customer has no linked account" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's email from auth
    const { data: { user: targetUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      customerAccount.auth_user_id
    );

    if (userError || !targetUser) {
      return new Response(JSON.stringify({ error: "Could not find user account" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a magic link for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email!,
      options: {
        redirectTo: `${req.headers.get("origin")}/my-orders`,
      },
    });

    if (linkError || !linkData) {
      console.error("Link generation error:", linkError);
      return new Response(JSON.stringify({ error: "Could not generate login link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract the token from the link and build direct login URL
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get("token");
    const type = url.searchParams.get("type");
    
    // Build the verification URL that will auto-login
    const loginUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(`${req.headers.get("origin")}/my-orders`)}`;

    return new Response(JSON.stringify({ loginUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Impersonation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
