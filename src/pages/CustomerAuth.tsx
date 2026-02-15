import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";

/** Detect whether the input looks like an email or a phone number */
const detectInputType = (value: string): "email" | "phone" => {
  if (value.includes("@")) return "email";
  return "phone";
};

const CustomerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  // Single unified identifier for login
  const [identifier, setIdentifier] = useState("");
  // Separate fields for signup
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from || "/my-orders";

  // Auto-detected type for login input
  const loginInputType = useMemo(() => detectInputType(identifier), [identifier]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate(redirectPath, { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate(redirectPath, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectPath]);

  // Format phone to email format for Supabase auth (phone as username)
  const phoneToEmail = (phoneNum: string) => {
    const cleaned = phoneNum.replace(/\D/g, '');
    return `${cleaned}@phone.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login — auto-detect phone or email from single input
        const trimmed = identifier.trim();
        if (!trimmed) throw new Error("Please enter your phone number or email");

        const type = detectInputType(trimmed);
        const authEmail = type === "phone" ? phoneToEmail(trimmed) : trimmed;

        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        // Signup — phone is required
        if (!name.trim()) throw new Error("Please enter your name");
        if (!signupPhone.trim()) throw new Error("Phone number is required");

        const authEmail = phoneToEmail(signupPhone);

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
              phone: signupPhone,
            }
          }
        });
        
        if (error) throw error;

        // Create customer record in CRM and link account
        if (data.user) {
          const customerPhone = signupPhone.trim();
          
          // First create (or find) a customers record
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", customerPhone)
            .maybeSingle();

          let customerId: string | null = existingCustomer?.id || null;

          if (!customerId) {
            const { data: newCustomer, error: customerError } = await supabase
              .from("customers")
              .insert({
                name: name.trim(),
                phone: customerPhone,
                email: signupEmail.trim() || null,
                gender: "other" as const,
              })
              .select("id")
              .single();

            if (customerError) {
              console.error("Failed to create customer record:", customerError);
            } else {
              customerId = newCustomer.id;
            }
          }

          // Then create customer_accounts linking auth user to customer
          const { error: accountError } = await supabase
            .from("customer_accounts")
            .insert({
              auth_user_id: data.user.id,
              customer_id: customerId,
              phone: customerPhone,
              email: signupEmail.trim() || null,
            });
          
          if (accountError) {
            console.error("Failed to create customer account:", accountError);
          }
        }

        toast.success("Account created! You can now login.");
        setIsLogin(true);
        setIdentifier(signupPhone); // Pre-fill login with phone
      }
    } catch (error: any) {
      if (error.message === "Invalid login credentials") {
        toast.error("Invalid credentials. Please check your details.");
      } else if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        toast.error("This account already exists. Please login instead.");
        setIsLogin(true);
      } else if (error.message?.includes("Unable to validate email")) {
        toast.error("Please enter a valid phone number.");
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
                ? "Sign in with your phone number or email" 
                : "Sign up to track your orders"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isLogin ? (
              /* ── LOGIN: Single auto-detecting input ── */
              <div className="space-y-2">
                <Label htmlFor="identifier">Phone or Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="01XXXXXXXXX or you@example.com"
                  required
                />
                {identifier && (
                  <p className="text-xs text-muted-foreground">
                    Detected: {loginInputType === "email" ? "Email" : "Phone number"}
                  </p>
                )}
              </div>
            ) : (
              /* ── SIGNUP: Name + Phone (required) + Email (optional) ── */
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupPhone">Phone Number *</Label>
                  <Input
                    id="signupPhone"
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email (optional)</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
              </>
            )}

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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
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