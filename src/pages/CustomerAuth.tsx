import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { trackCompleteRegistration, setAdvancedMatchingUser } from "@/services/facebook-pixel.service";


const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhone = (value: string) => /^(\+?880|0)?1[3-9]\d{8}$/.test(value.replace(/\D/g, ""));

// Ensure a customer + customer_accounts row exists for any auth user (used after OAuth)
const ensureCustomerForUser = async (user: any) => {
  const { data: existing } = await supabase
    .from("customer_accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (existing) return;

  const meta = user.user_metadata || {};
  const email: string | null = user.email && !user.email.endsWith("@phone.local") ? user.email : null;
  const fullName: string = meta.full_name || meta.name || (email ? email.split("@")[0] : "Customer");

  const { data: newCustomer } = await supabase
    .from("customers")
    .insert({
      name: fullName,
      phone: `user_${user.id.slice(0, 8)}`,
      email,
      gender: "other",
      is_active: true,
    })
    .select("id")
    .single();

  await supabase.from("customer_accounts").insert({
    auth_user_id: user.id,
    customer_id: newCustomer?.id ?? null,
    phone: null,
    email,
  });
};


const CustomerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from || "/account";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Fire-and-forget: ensure CRM customer record exists (OAuth users)
        ensureCustomerForUser(session.user).catch((e) => console.error(e));
        navigate(redirectPath, { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        ensureCustomerForUser(session.user).catch((e) => console.error(e));
        navigate(redirectPath, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectPath]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/login",
      });
      if (result.error) throw result.error;
      // If redirected:true, browser will navigate away; otherwise session is set and listener will redirect.
    } catch (error: any) {
      toast.error(error?.message || "Google sign-in failed");
      setIsLoading(false);
    }
  };

  const phoneToEmail = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    return `${cleaned}@phone.local`;
  };

  const resolveAuthEmail = (input: string): { authEmail: string; type: "email" | "phone" } | null => {
    const trimmed = input.trim();
    if (isEmail(trimmed)) return { authEmail: trimmed, type: "email" };
    if (isPhone(trimmed)) return { authEmail: phoneToEmail(trimmed), type: "phone" };
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const resolved = resolveAuthEmail(identifier);

      if (!isLogin) {
        // Registration: phone only, strict BD format
        if (!isPhone(identifier.trim())) {
          throw new Error("Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX)");
        }
      } else {
        if (!resolved) {
          throw new Error("Please enter a valid phone number or email address");
        }
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: resolved.authEmail,
          password,
        });
        if (error) throw error;
        // Advanced Matching: hand user identifiers to Meta Pixel
        setAdvancedMatchingUser({
          em: resolved.type === "email" ? resolved.authEmail : undefined,
          ph: resolved.type === "phone" ? identifier.replace(/\D/g, "") : undefined,
        });
        toast.success("Welcome back!");

      } else {
        if (!name.trim()) throw new Error("Please enter your name");

        const { data, error } = await supabase.auth.signUp({
          email: resolved.authEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
              phone: resolved.type === "phone" ? identifier.trim() : undefined,
            },
          },
        });
        if (error) throw error;

        if (data.user) {
          // First, create the CRM customer record so they appear in admin list
          const phone = resolved.type === "phone" ? identifier.trim() : null;
          const email = resolved.type === "email" ? identifier.trim() : null;

          let customerId: string | null = null;

          // Check if a customer already exists with this phone/email
          if (phone) {
            const { data: existingId } = await supabase
              .rpc("find_customer_id_by_phone", { p_phone: phone });
            customerId = (existingId as string | null) ?? null;
          }

          if (!customerId) {
            // Create a new customer record in the CRM
            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: name.trim(),
                phone: phone || `user_${data.user.id.slice(0, 8)}`,
                email: email ?? null,
                gender: "other",
                is_active: true,
              })
              .select("id")
              .single();

            if (customerError) {
              console.error("Failed to create customer record:", customerError);
            } else {
              customerId = newCustomer?.id ?? null;
            }
          }

          // Create the customer_accounts link record
          const { error: accountError } = await supabase
            .from("customer_accounts")
            .insert({
              auth_user_id: data.user.id,
              customer_id: customerId,
              phone: phone,
              email: email,
            });
          if (accountError) console.error("Failed to create customer account:", accountError);
        }

        // Advanced Matching + CompleteRegistration event for Meta Pixel
        const phoneDigits = resolved.type === "phone" ? identifier.replace(/\D/g, "") : undefined;
        const [firstName, ...rest] = name.trim().split(/\s+/);
        setAdvancedMatchingUser({
          em: resolved.type === "email" ? identifier.trim() : undefined,
          ph: phoneDigits,
          fn: firstName,
          ln: rest.join(" ") || undefined,
          country: "bd",
        });
        trackCompleteRegistration({
          status: true,
          value: 0,
          currency: "BDT",
        });

        toast.success("Account created! You can now login.");
        setIsLogin(true);
      }

    } catch (error: any) {
      if (error.message === "Invalid login credentials") {
        toast.error("Invalid credentials. Please check your details.");
      } else if (error.message?.includes("already registered")) {
        toast.error("This account already exists. Please login instead.");
        setIsLogin(true);
      } else {
        toast.error(error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PoshplexHeader />

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-medium tracking-tight">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {isLogin
                ? "Log in to view your orders"
                : "Create an account to track your orders"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 gap-2 font-medium"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">{isLogin ? "Phone or Email" : "Phone Number"}</Label>
              <Input
                id="identifier"
                type={isLogin ? "text" : "tel"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={isLogin ? "Enter phone number or email" : "01XXXXXXXXX"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isLogin ? "Log In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className={isLogin
                ? "text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                : "text-sm text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {isLogin
                ? "Don't have an account? Create Account"
                : "Already have an account? Log in"}
            </button>
            <div className="text-sm text-muted-foreground">
              <Link to="/order-tracking" className="hover:text-foreground transition-colors">
                Track order without account →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PoshplexFooter />
    </div>
  );
};

export default CustomerAuth;
