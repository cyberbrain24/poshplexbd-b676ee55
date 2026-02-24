import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhone = (value: string) => /^(\+?880|0)?1[3-9]\d{8}$/.test(value.replace(/\D/g, ""));

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = identifier.trim();

    let authEmail: string;
    if (isEmail(trimmed)) {
      authEmail = trimmed;
    } else if (isPhone(trimmed)) {
      const cleaned = trimmed.replace(/\D/g, "");
      authEmail = `${cleaned}@phone.local`;
    } else {
      toast.error("Please enter a valid email or phone number");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      if (isEmail(trimmed)) {
        toast.success("Password reset link sent to your email!");
      } else {
        toast.info("If an account exists with this phone, a reset link has been sent to the associated email.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link");
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
            <h1 className="text-2xl font-medium tracking-tight">Forgot Password</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your email or phone number and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Check your email inbox for the password reset link. It may take a minute.
              </p>
              <Link to="/login" className="text-sm text-primary hover:underline">
                ← Back to Login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Email or Phone</Label>
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or phone number"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending…" : "Send Reset Link"}
                </Button>
              </form>
              <div className="text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <PoshplexFooter />
    </div>
  );
};

export default ForgotPassword;
