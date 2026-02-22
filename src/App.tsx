import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./contexts/CartContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MobileFooterNav from "./components/navigation/MobileFooterNav";
import FacebookPixelTracker from "./components/tracking/FacebookPixelTracker";

// Storefront pages - eagerly loaded
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Category from "./pages/Category";
import CategoryBrowser from "./pages/CategoryBrowser";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OurStory from "./pages/about/OurStory";
import StoreLocator from "./pages/about/StoreLocator";
import PrivacyPolicy from "./pages/about/PrivacyPolicy";
import TermsConditions from "./pages/about/TermsConditions";
import ShippingDelivery from "./pages/about/ShippingDelivery";
import Auth from "./pages/Auth";
import CustomerAuth from "./pages/CustomerAuth";
import CustomerAccount from "./pages/CustomerAccount";
import OrderTracking from "./pages/OrderTracking";
import MyOrders from "./pages/MyOrders";
import Membership from "./pages/Membership";

// Admin pages - lazy loaded (separate chunk, never downloaded by storefront users)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminColors = lazy(() => import("./pages/admin/AdminColors"));
const AdminSizes = lazy(() => import("./pages/admin/AdminSizes"));
const AdminMaterials = lazy(() => import("./pages/admin/AdminMaterials"));
const AdminSizeGuides = lazy(() => import("./pages/admin/AdminSizeGuides"));
const AdminCareInstructions = lazy(() => import("./pages/admin/AdminCareInstructions"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBrands = lazy(() => import("./pages/admin/AdminBrands"));
const AdminAccounts = lazy(() => import("./pages/admin/AdminAccounts"));
const AdminAccountsList = lazy(() => import("./pages/admin/AdminAccountsList"));
const AdminIncomeCategories = lazy(() => import("./pages/admin/AdminIncomeCategories"));
const AdminExpenseCategories = lazy(() => import("./pages/admin/AdminExpenseCategories"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminDivisions = lazy(() => import("./pages/admin/AdminDivisions"));
const AdminThanas = lazy(() => import("./pages/admin/AdminThanas"));
const AdminCustomerTypes = lazy(() => import("./pages/admin/AdminCustomerTypes"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminPaymentMethods = lazy(() => import("./pages/admin/AdminPaymentMethods"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminInventoryIn = lazy(() => import("./pages/admin/AdminInventoryIn"));
const AdminInventoryOut = lazy(() => import("./pages/admin/AdminInventoryOut"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: false,
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

// Shared loading fallback for lazy admin routes
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ScrollToTop />
            <FacebookPixelTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/categories" element={<CategoryBrowser />} />
              <Route path="/category/:category" element={<Category />} />
              <Route path="/product/:productSlug" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/my-orders" element={<MyOrders />} />
              <Route path="/account" element={<CustomerAccount />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/pages/our-story" element={<OurStory />} />
              <Route path="/pages/store-locator" element={<StoreLocator />} />
              <Route path="/pages/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/pages/terms-conditions" element={<TermsConditions />} />
              <Route path="/pages/shipping-delivery" element={<ShippingDelivery />} />
              <Route path="/about/*" element={<OurStory />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsConditions />} />
              <Route path="/shipping-delivery" element={<ShippingDelivery />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<CustomerAuth />} />
              
              {/* Admin Routes - Lazy loaded */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLayout />
                  </Suspense>
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="colors" element={<AdminColors />} />
                <Route path="sizes" element={<AdminSizes />} />
                <Route path="materials" element={<AdminMaterials />} />
                <Route path="size-guides" element={<AdminSizeGuides />} />
                <Route path="care-instructions" element={<AdminCareInstructions />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                <Route path="accounts" element={<AdminAccounts />} />
                <Route path="accounts-list" element={<AdminAccountsList />} />
                <Route path="income-categories" element={<AdminIncomeCategories />} />
                <Route path="expense-categories" element={<AdminExpenseCategories />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="divisions" element={<AdminDivisions />} />
                <Route path="thanas" element={<AdminThanas />} />
                <Route path="customer-types" element={<AdminCustomerTypes />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="payment-methods" element={<AdminPaymentMethods />} />
                <Route path="promo-codes" element={<AdminPromoCodes />} />
                <Route path="inventory-in" element={<AdminInventoryIn />} />
                <Route path="inventory-out" element={<AdminInventoryOut />} />
                <Route path="site-settings" element={<AdminSiteSettings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileFooterNav />
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
