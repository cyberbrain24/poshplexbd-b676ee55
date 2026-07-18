type Loader = () => Promise<unknown>;

export const adminRouteLoaders: Record<string, Loader> = {
  "/admin": () => import("@/pages/admin/AdminDashboard"),
  "/admin/products": () => import("@/pages/admin/AdminProducts"),
  "/admin/colors": () => import("@/pages/admin/AdminColors"),
  "/admin/sizes": () => import("@/pages/admin/AdminSizes"),
  "/admin/size-guides": () => import("@/pages/admin/AdminSizeGuides"),
  "/admin/categories": () => import("@/pages/admin/AdminCategories"),
  "/admin/bulk-upload": () => import("@/pages/admin/AdminBulkUpload"),
  "/admin/orders": () => import("@/pages/admin/AdminOrders"),
  "/admin/payment-methods": () => import("@/pages/admin/AdminPaymentMethods"),
  "/admin/customers": () => import("@/pages/admin/AdminCustomers"),
  "/admin/reviews": () => import("@/pages/admin/AdminReviews"),
  "/admin/divisions": () => import("@/pages/admin/AdminDivisions"),
  "/admin/thanas": () => import("@/pages/admin/AdminThanas"),
  "/admin/customer-types": () => import("@/pages/admin/AdminCustomerTypes"),
  "/admin/site-settings": () => import("@/pages/admin/AdminSiteSettings"),
  "/admin/marketing": () => import("@/pages/admin/marketing/MarketingOverview"),
  "/admin/marketing/meta-pixel": () => import("@/pages/admin/marketing/MetaPixelSettings"),
  "/admin/marketing/meta-capi": () => import("@/pages/admin/marketing/MetaCapiSettings"),
  "/admin/marketing/steadfast": () => import("@/pages/admin/marketing/SteadfastSettings"),
};

const prefetched = new Set<string>();

export function prefetchAdminRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = adminRouteLoaders[path];
  if (!loader) return;
  prefetched.add(path);
  loader().catch(() => prefetched.delete(path));
}
