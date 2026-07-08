// Map admin routes to their lazy chunk loaders so we can prefetch on hover.
// Importing the same dynamic import a second time is a no-op (module cache),
// so calling these on mouseenter / focus warms the chunk for instant nav.

type Loader = () => Promise<unknown>;

export const adminRouteLoaders: Record<string, Loader> = {
  "/admin": () => import("@/pages/admin/AdminDashboard"),
  "/admin/products": () => import("@/pages/admin/AdminProducts"),
  "/admin/colors": () => import("@/pages/admin/AdminColors"),
  "/admin/sizes": () => import("@/pages/admin/AdminSizes"),
  "/admin/materials": () => import("@/pages/admin/AdminMaterials"),
  "/admin/size-guides": () => import("@/pages/admin/AdminSizeGuides"),
  "/admin/care-instructions": () => import("@/pages/admin/AdminCareInstructions"),
  "/admin/categories": () => import("@/pages/admin/AdminCategories"),
  "/admin/brands": () => import("@/pages/admin/AdminBrands"),
  "/admin/bulk-upload": () => import("@/pages/admin/AdminBulkUpload"),
  "/admin/orders": () => import("@/pages/admin/AdminOrders"),
  "/admin/payment-methods": () => import("@/pages/admin/AdminPaymentMethods"),
  "/admin/promo-codes": () => import("@/pages/admin/AdminPromoCodes"),
  "/admin/accounts": () => import("@/pages/admin/AdminAccounts"),
  "/admin/accounts-list": () => import("@/pages/admin/AdminAccountsList"),
  "/admin/income-categories": () => import("@/pages/admin/AdminIncomeCategories"),
  "/admin/expense-categories": () => import("@/pages/admin/AdminExpenseCategories"),
  "/admin/customers": () => import("@/pages/admin/AdminCustomers"),
  "/admin/reviews": () => import("@/pages/admin/AdminReviews"),
  "/admin/divisions": () => import("@/pages/admin/AdminDivisions"),
  "/admin/thanas": () => import("@/pages/admin/AdminThanas"),
  "/admin/customer-types": () => import("@/pages/admin/AdminCustomerTypes"),
  "/admin/media": () => import("@/pages/admin/AdminMedia"),
  "/admin/site-settings": () => import("@/pages/admin/AdminSiteSettings"),
  "/admin/marketing": () => import("@/pages/admin/marketing/MarketingOverview"),
  "/admin/marketing/meta-pixel": () => import("@/pages/admin/marketing/MetaPixelSettings"),
  "/admin/marketing/meta-capi": () => import("@/pages/admin/marketing/MetaCapiSettings"),
  "/admin/marketing/ga4": () => import("@/pages/admin/marketing/GA4Settings"),
  
  "/admin/marketing/steadfast": () => import("@/pages/admin/marketing/SteadfastSettings"),
  
  "/admin/reports": () => import("@/pages/admin/reports/ReportsOverview"),
  "/admin/reports/orders": () => import("@/pages/admin/reports/OrdersReport"),
  "/admin/reports/financial": () => import("@/pages/admin/reports/FinancialReport"),
  "/admin/reports/customers": () => import("@/pages/admin/reports/CustomersReport"),
  "/admin/reports/products": () => import("@/pages/admin/reports/ProductsReport"),
  "/admin/reports/inventory": () => import("@/pages/admin/reports/InventoryReport"),
  "/admin/reports/promos": () => import("@/pages/admin/reports/PromosReport"),
  "/admin/reports/reviews": () => import("@/pages/admin/reports/ReviewsReport"),
  "/admin/email": () => import("@/pages/admin/AdminEmail"),
};

const prefetched = new Set<string>();

export function prefetchAdminRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = adminRouteLoaders[path];
  if (!loader) return;
  prefetched.add(path);
  // Fire and forget; failures are fine — user click will retry naturally.
  loader().catch(() => prefetched.delete(path));
}
