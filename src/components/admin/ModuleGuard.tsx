import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useModulesContext } from "@/contexts/ModulesContext";
import { Skeleton } from "@/components/ui/skeleton";

interface ModuleGuardProps {
  children: ReactNode;
}

const ModuleGuard = ({ children }: ModuleGuardProps) => {
  const location = useLocation();
  const { isLoading, isRouteAccessible } = useModulesContext();

  // Show loading state while checking modules
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Check if current route is accessible
  if (!isRouteAccessible(location.pathname)) {
    // Redirect to dashboard if module is deactivated
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default ModuleGuard;
