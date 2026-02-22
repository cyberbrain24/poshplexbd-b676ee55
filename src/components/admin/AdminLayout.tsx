import { ReactNode, Suspense, useEffect, useRef, useTransition } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { AdminErrorBoundary } from "./AdminErrorBoundary";
import { AdminLoadingSpinner } from "./AdminLoadingState";
import { useERPDataPrefetch } from "@/hooks/useERPPrefetch";

// Routes that benefit from ERP reference data prefetch
const ERP_ROUTES = ["/admin", "/admin/products", "/admin/orders", "/admin/inventory-in", "/admin/inventory-out", "/admin/customers"];

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const previousPathRef = useRef(location.pathname);

  // Conditionally prefetch ERP data only on routes that use it
  const needsERP = ERP_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + "/"));
  useERPDataPrefetch(needsERP);

  // Track navigation changes for transition handling
  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      startTransition(() => {
        previousPathRef.current = location.pathname;
      });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 relative">
        {/* Subtle loading overlay during transitions */}
        {isPending && (
          <div className="absolute inset-0 bg-background/50 z-10 pointer-events-none" />
        )}
        
        <AdminErrorBoundary key={location.pathname}>
          <Suspense fallback={<AdminLoadingSpinner />}>
            {children || <Outlet key={location.pathname} />}
          </Suspense>
        </AdminErrorBoundary>
      </main>
    </div>
  );
};

export default AdminLayout;
