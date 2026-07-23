import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions, canAccess, ModuleKey } from "@/hooks/usePermissions";

interface Props { module: ModuleKey; children: ReactNode; }

const PermissionGuard = ({ module, children }: Props) => {
  const state = usePermissions();
  if (state.isLoading) return null;
  if (!canAccess(state, module)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
};

export default PermissionGuard;
