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
import AdminLayout from "./components/admin/AdminLayout";
import MobileFooterNav from "./components/navigation/MobileFooterNav";
import GA4Script from "./components/GA4Script";

// Critical pages - direct imports (above the fold / high traffic)
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category";

// Lazy-loaded pages (lower traffic or below initial viewport)
const NotFound = lazy(() => import("./pages/NotFound"));
const CategoryBrowser = lazy(() => import("./pages/CategoryBrowser"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const Sustainability = lazy(() => import("./pages/about/Sustainability"));
const SizeGuide = lazy(() => import("./pages/about/SizeGuide"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Auth = lazy(() => import("./pages/Auth"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Membership = lazy(() => import("./pages/Membership"));

// Admin pages - all lazy loaded
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
const AdminSEO = lazy(() => import("./pages/admin/AdminSEO"));
const AdminSeedData = lazy(() => import("./pages/admin/AdminSeedData"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminPromoCodes = lazy(() => import("./pages/admin/AdminPromoCodes"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: false,
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
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
            <GA4Script />
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Critical Routes - eagerly loaded */}
                <Route path="/" element={<Index />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/product/:productSlug" element={<ProductDetail />} />
                
                {/* Lazy-loaded Routes */}
                <Route path="/categories" element={<CategoryBrowser />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-tracking" element={<OrderTracking />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/account" element={<CustomerAccount />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/about/our-story" element={<OurStory />} />
                <Route path="/about/sustainability" element={<Sustainability />} />
                <Route path="/about/size-guide" element={<SizeGuide />} />
                <Route path="/about/customer-care" element={<CustomerCare />} />
                <Route path="/about/store-locator" element={<StoreLocator />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<CustomerAuth />} />
                
                {/* Admin Routes - all lazy loaded under protected layout */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="media" element={<AdminMedia />} />
                  <Route path="seo" element={<AdminSEO />} />
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
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="seed-data" element={<AdminSeedData />} />
                </Route>
                
                {/* 404 Catch-all - MUST be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <MobileFooterNav />
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;