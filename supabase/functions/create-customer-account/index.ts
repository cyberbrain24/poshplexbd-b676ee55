import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { checkRateLimit, getClientIP, rateLimitResponse } from "../_shared/rate-limiter.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  // Rate limiting
  const ip = getClientIP(req);
  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return rateLimitResponse(corsHeaders, retryAfter);
  }

  try {
    const { customerId, phone, email, name, password } = await req.json();

    if (!customerId || !phone) {
      return new Response(
        JSON.stringify({ error: "Customer ID and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if customer already has an account
    const { data: existingAccount } = await supabase
      .from("customer_accounts")
      .select("id")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (existingAccount) {
      return new Response(
        JSON.stringify({ success: true, message: "Account already exists", accountId: existingAccount.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's an account with this phone number
    const { data: existingPhoneAccount } = await supabase
      .from("customer_accounts")
      .select("id, customer_id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingPhoneAccount) {
      if (!existingPhoneAccount.customer_id) {
        await supabase
          .from("customer_accounts")
          .update({ customer_id: customerId })
          .eq("id", existingPhoneAccount.id);
      }
      return new Response(
        JSON.stringify({ success: true, message: "Linked to existing account", accountId: existingPhoneAccount.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with phone-based email
    const phoneEmail = `${phone}@phone.local`;
    const defaultPassword = (typeof password === "string" && password.length >= 6) ? password : "poshplex";

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: phoneEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { name, phone }
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === phoneEmail);
        
        if (existingUser) {
          const { data: newAccount, error: accountError } = await supabase
            .from("customer_accounts")
            .insert({
              auth_user_id: existingUser.id,
              customer_id: customerId,
              phone: phone,
              email: email || null
            })
            .select()
            .single();

          if (accountError) {
            console.error("Error creating customer account:", accountError);
          }

          return new Response(
            JSON.stringify({ success: true, message: "Linked to existing auth user", accountId: newAccount?.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create customer_accounts record
    const { data: customerAccount, error: accountError } = await supabase
      .from("customer_accounts")
      .insert({
        auth_user_id: authUser.user.id,
        customer_id: customerId,
        phone: phone,
        email: email || null
      })
      .select()
      .single();

    if (accountError) {
      console.error("Error creating customer account:", accountError);
      return new Response(
        JSON.stringify({ error: accountError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Customer account created",
        accountId: customerAccount.id,
        authUserId: authUser.user.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
