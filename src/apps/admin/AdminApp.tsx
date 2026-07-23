import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PermissionGuard from "@/components/admin/PermissionGuard";
import type { ModuleKey } from "@/hooks/usePermissions";

const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminColors = lazy(() => import("@/pages/admin/AdminColors"));
const AdminSizes = lazy(() => import("@/pages/admin/AdminSizes"));
const AdminSizeGuides = lazy(() => import("@/pages/admin/AdminSizeGuides"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminCustomers = lazy(() => import("@/pages/admin/AdminCustomers"));
const AdminDivisions = lazy(() => import("@/pages/admin/AdminDivisions"));
const AdminThanas = lazy(() => import("@/pages/admin/AdminThanas"));
const AdminCustomerTypes = lazy(() => import("@/pages/admin/AdminCustomerTypes"));
const AdminOrders = lazy(() => import("@/pages/admin/AdminOrders"));
const AdminAddOrder = lazy(() => import("@/pages/admin/AdminAddOrder"));
const AdminOrderFulfillment = lazy(() => import("@/pages/admin/AdminOrderFulfillment"));
const AdminPaymentMethods = lazy(() => import("@/pages/admin/AdminPaymentMethods"));
const AdminReviews = lazy(() => import("@/pages/admin/AdminReviews"));
const AdminSiteSettings = lazy(() => import("@/pages/admin/AdminSiteSettings"));
const AdminUserRoles = lazy(() => import("@/pages/admin/AdminUserRoles"));

const MarketingLayout = lazy(() => import("@/pages/admin/marketing/MarketingLayout"));
const MarketingOverview = lazy(() => import("@/pages/admin/marketing/MarketingOverview"));
const MetaPixelSettings = lazy(() => import("@/pages/admin/marketing/MetaPixelSettings"));
const MetaCapiSettings = lazy(() => import("@/pages/admin/marketing/MetaCapiSettings"));
const SteadfastSettings = lazy(() => import("@/pages/admin/marketing/SteadfastSettings"));

const AdminLoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const G = (mod: ModuleKey, el: JSX.Element) => <PermissionGuard module={mod}>{el}</PermissionGuard>;

const AdminApp = () => (
  <ProtectedRoute>
    <Suspense fallback={<AdminLoadingFallback />}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={G("products", <AdminProducts />)} />
          <Route path="reviews" element={G("reviews", <AdminReviews />)} />
          <Route path="colors" element={G("colors", <AdminColors />)} />
          <Route path="sizes" element={G("sizes", <AdminSizes />)} />
          <Route path="size-guides" element={G("size-guides", <AdminSizeGuides />)} />
          <Route path="categories" element={G("categories", <AdminCategories />)} />
          <Route path="customers" element={G("customers", <AdminCustomers />)} />
          <Route path="divisions" element={G("divisions", <AdminDivisions />)} />
          <Route path="thanas" element={G("thanas", <AdminThanas />)} />
          <Route path="customer-types" element={G("customer-types", <AdminCustomerTypes />)} />
          <Route path="add-order" element={G("add-order", <AdminAddOrder />)} />
          <Route path="orders" element={G("orders", <AdminOrders />)} />
          <Route path="order-fulfillment" element={G("order-fulfillment", <AdminOrderFulfillment />)} />
          <Route path="payment-methods" element={G("payment-methods", <AdminPaymentMethods />)} />
          <Route path="site-settings" element={G("site-settings", <AdminSiteSettings />)} />
          <Route path="user-roles" element={G("user-roles", <AdminUserRoles />)} />
          <Route path="marketing" element={G("marketing", <MarketingLayout />)}>
            <Route index element={<MarketingOverview />} />
            <Route path="meta-pixel" element={<MetaPixelSettings />} />
            <Route path="meta-capi" element={<MetaCapiSettings />} />
            <Route path="steadfast" element={<SteadfastSettings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </ProtectedRoute>
);

export default AdminApp;
