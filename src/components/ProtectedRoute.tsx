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
  const [mfaRequired, setMfaRequired] = useState(false); // Set to true to enforce MFA for admins
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

  const checkMfaStatus = useCallback(async (): Promise<{ enrolled: boolean; verified: boolean }> => {
    try {
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error("MFA check error:", error);
        return { enrolled: false, verified: false };
      }

      const totpFactors = factors?.totp || [];
      if (totpFactors.length === 0) {
        return { enrolled: false, verified: false };
      }

      // Check if any factor is verified
      const verifiedFactor = totpFactors.find(f => f.status === "verified");
      if (!verifiedFactor) {
        return { enrolled: true, verified: false };
      }

      // Check AAL level - admin needs aal2
      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) {
        console.error("AAL check error:", aalError);
        return { enrolled: true, verified: true };
      }

      return {
        enrolled: true,
        verified: aalData.currentLevel === "aal2",
      };
    } catch (err) {
      console.error("MFA status check error:", err);
      return { enrolled: false, verified: false };
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
          } else {
            // MFA enforcement disabled — enable when ready
            // To re-enable, uncomment the MFA check below:
            // const mfaStatus = await checkMfaStatus();
            // if (!mfaStatus.enrolled || !mfaStatus.verified) setMfaRequired(true);
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
  }, [navigate, requireAdmin, checkAdminRole, checkMfaStatus]);

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

  // Show MFA enrollment/verification prompt for admin users
  if (requireAdmin && mfaRequired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-accent flex items-center justify-center">
            <svg className="h-8 w-8 text-accent-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Multi-Factor Authentication Required
          </h2>
          <p className="text-muted-foreground text-sm">
            As an admin user, multi-factor authentication (MFA) is required for enhanced security.
            Please set up MFA through your account settings or contact your system administrator.
          </p>
          <button
            onClick={() => {
              // Allow admin to proceed with a warning (soft enforcement)
              setMfaRequired(false);
              toast.warning("MFA is recommended for admin accounts. Please enable it soon.");
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
          >
            Continue without MFA
          </button>
          <p className="text-xs text-muted-foreground">
            Proceeding without MFA is temporary. Enable MFA for full security compliance.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
