import { ReactNode, Suspense, useEffect, useRef, useTransition } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { AdminErrorBoundary } from "./AdminErrorBoundary";
import { AdminLoadingSpinner } from "./AdminLoadingState";
import { useERPDataPrefetch } from "@/hooks/useERPPrefetch";
import { adminRouteLoaders, prefetchAdminRoute } from "@/lib/adminRoutePrefetch";

const ERP_ROUTES = ["/admin", "/admin/products", "/admin/orders", "/admin/inventory-in", "/admin/inventory-out", "/admin/customers"];

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const [isPending, startTransition] = useTransition();
  const previousPathRef = useRef(location.pathname);

  const needsERP = ERP_ROUTES.some(r => location.pathname === r || location.pathname.startsWith(r + "/"));
  useERPDataPrefetch(needsERP);

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
      <main className="flex-1 p-4 pt-16 md:p-8 md:pt-8 min-w-0 relative">
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
