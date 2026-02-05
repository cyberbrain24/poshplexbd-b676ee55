import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = true }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error("Error in checkAdminRole:", err);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session) {
        setIsLoading(false);
        navigate("/auth", { state: { from: window.location.pathname } });
        return;
      }

      if (requireAdmin) {
        const hasAdminRole = await checkAdminRole(session.user.id);
        setIsAdmin(hasAdminRole);

        if (!hasAdminRole) {
          toast.error("Access denied: Admin privileges required");
          navigate("/");
        }
      } else {
        setIsAdmin(true);
      }

      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);

      if (!session) {
        setIsLoading(false);
        navigate("/auth", { state: { from: window.location.pathname } });
        return;
      }

      if (requireAdmin && event === "SIGNED_IN") {
        const hasAdminRole = await checkAdminRole(session.user.id);
        setIsAdmin(hasAdminRole);

        if (!hasAdminRole) {
          toast.error("Access denied: Admin privileges required");
          navigate("/");
        }
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, requireAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
