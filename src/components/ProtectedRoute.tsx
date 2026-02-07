import { ReactNode, useEffect, useState, useCallback } from "react";
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

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
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
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authCheckInProgress = false;
    
    const handleAuthSession = async (currentSession: Session | null) => {
      if (!isMounted || authCheckInProgress) return;
      authCheckInProgress = true;

      try {
        if (!currentSession) {
          setSession(null);
          setIsAdmin(null);
          setIsLoading(false);
          navigate("/auth", { state: { from: window.location.pathname }, replace: true });
          return;
        }

        setSession(currentSession);

        if (requireAdmin) {
          const hasAdminRole = await checkAdminRole(currentSession.user.id);
          if (!isMounted) return;
          
          setIsAdmin(hasAdminRole);

          if (!hasAdminRole) {
            toast.error("Access denied: Admin privileges required");
            navigate("/", { replace: true });
          }
        } else {
          setIsAdmin(true);
        }

        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Auth handling error:", err);
        if (isMounted) {
          setSession(null);
          setIsAdmin(null);
          setIsLoading(false);
          navigate("/auth", { state: { from: window.location.pathname }, replace: true });
        }
      } finally {
        authCheckInProgress = false;
      }
    };
    
    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error("Session error:", error);
          setSession(null);
          setIsLoading(false);
          navigate("/auth", { state: { from: window.location.pathname }, replace: true });
          return;
        }
        
        await handleAuthSession(currentSession);
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
          navigate("/auth", { state: { from: window.location.pathname }, replace: true });
        }
      }
    };

    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      
      console.log("Auth state change:", event);
      
      if (event === "SIGNED_OUT") {
        setSession(null);
        setIsAdmin(null);
        setIsLoading(false);
        navigate("/auth", { state: { from: window.location.pathname }, replace: true });
        return;
      }
      
      // For SIGNED_IN events, defer to avoid deadlock
      if (event === "SIGNED_IN" && newSession) {
        setTimeout(() => {
          if (isMounted) {
            handleAuthSession(newSession);
          }
        }, 0);
      }
    });

    // THEN check for existing session
    initAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, requireAdmin, checkAdminRole]);

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