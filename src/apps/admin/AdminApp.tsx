import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";

const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/AdminProducts"));
const AdminColors = lazy(() => import("@/pages/admin/AdminColors"));
const AdminSizes = lazy(() => import("@/pages/admin/AdminSizes"));
const AdminMaterials = lazy(() => import("@/pages/admin/AdminMaterials"));

const AdminProductAttributes = lazy(() => import("@/pages/admin/AdminProductAttributes"));
const AdminSizeGuides = lazy(() => import("@/pages/admin/AdminSizeGuides"));
const AdminCareInstructions = lazy(() => import("@/pages/admin/AdminCareInstructions"));
const AdminCategories = lazy(() => import("@/pages/admin/AdminCategories"));
const AdminBrands = lazy(() => import("@/pages/admin/AdminBrands"));
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
const AdminBulkUpload = lazy(() => import("@/pages/admin/AdminBulkUpload"));

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

const AdminApp = () => (
  <ProtectedRoute>
    <Suspense fallback={<AdminLoadingFallback />}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="colors" element={<AdminColors />} />
          <Route path="sizes" element={<AdminSizes />} />
          <Route path="materials" element={<AdminMaterials />} />
          
          <Route path="product-attributes" element={<AdminProductAttributes />} />
          <Route path="size-guides" element={<AdminSizeGuides />} />
          <Route path="care-instructions" element={<AdminCareInstructions />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="divisions" element={<AdminDivisions />} />
          <Route path="thanas" element={<AdminThanas />} />
          <Route path="customer-types" element={<AdminCustomerTypes />} />
          <Route path="add-order" element={<AdminAddOrder />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="order-fulfillment" element={<AdminOrderFulfillment />} />
          <Route path="payment-methods" element={<AdminPaymentMethods />} />
          
          <Route path="bulk-upload" element={<AdminBulkUpload />} />
          <Route path="site-settings" element={<AdminSiteSettings />} />
          <Route path="marketing" element={<MarketingLayout />}>
            <Route index element={<MarketingOverview />} />
            <Route path="meta-pixel" element={<MetaPixelSettings />} />
            <Route path="meta-capi" element={<MetaCapiSettings />} />
            <Route path="ga4" element={<GA4Settings />} />
            <Route path="steadfast" element={<SteadfastSettings />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  </ProtectedRoute>
);

export default AdminApp;
