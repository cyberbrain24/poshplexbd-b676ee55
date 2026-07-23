import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from || "/admin";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Sub-admin username support: if input has no "@", treat as username → shadow email
    const loginEmail = email.includes("@")
      ? email.trim()
      : `${email.trim().toLowerCase()}@admin.local`;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) throw error;
      toast.success("Logged in successfully");
    } catch (error: any) {
      if (error.message === "Invalid login credentials") {
        toast.error("Invalid email/username or password");
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
              Admin Login
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to access the admin panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : "Sign In"}
            </Button>
          </form>
        </div>
      </div>

      <PoshplexFooter />
    </div>
  );
};

export default Auth;
