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

// Storefront pages - only homepage and 404 on critical path
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Storefront pages - lazy loaded (deferred until navigation)
const Category = lazy(() => import("./pages/Category"));
const CategoryBrowser = lazy(() => import("./pages/CategoryBrowser"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const Sustainability = lazy(() => import("./pages/about/Sustainability"));
const SizeGuide = lazy(() => import("./pages/about/SizeGuide"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ShippingDelivery = lazy(() => import("./pages/ShippingDelivery"));
const Auth = lazy(() => import("./pages/Auth"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Membership = lazy(() => import("./pages/Membership"));

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      // Prevent showing error state for cancelled queries
      throwOnError: false,
      // Keep previous data during refetch for smoother UX
      placeholderData: (previousData: unknown) => previousData,
    },
  },
});

// Shared loading fallback for lazy routes
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
            <Routes>
              {/* Homepage - on critical path, no Suspense needed */}
              <Route path="/" element={<Index />} />

              {/* Storefront Routes - lazy loaded */}
              <Route path="/categories" element={<Suspense fallback={<LoadingFallback />}><CategoryBrowser /></Suspense>} />
              <Route path="/category/:category" element={<Suspense fallback={<LoadingFallback />}><Category /></Suspense>} />
              <Route path="/product/:productSlug" element={<Suspense fallback={<LoadingFallback />}><ProductDetail /></Suspense>} />
              <Route path="/checkout" element={<Suspense fallback={<LoadingFallback />}><Checkout /></Suspense>} />
              <Route path="/order-tracking" element={<Suspense fallback={<LoadingFallback />}><OrderTracking /></Suspense>} />
              <Route path="/my-orders" element={<Suspense fallback={<LoadingFallback />}><MyOrders /></Suspense>} />
              <Route path="/account" element={<Suspense fallback={<LoadingFallback />}><CustomerAccount /></Suspense>} />
              <Route path="/membership" element={<Suspense fallback={<LoadingFallback />}><Membership /></Suspense>} />
              <Route path="/about/our-story" element={<Suspense fallback={<LoadingFallback />}><OurStory /></Suspense>} />
              <Route path="/about/sustainability" element={<Suspense fallback={<LoadingFallback />}><Sustainability /></Suspense>} />
              <Route path="/about/size-guide" element={<Suspense fallback={<LoadingFallback />}><SizeGuide /></Suspense>} />
              <Route path="/about/customer-care" element={<Suspense fallback={<LoadingFallback />}><CustomerCare /></Suspense>} />
              <Route path="/about/store-locator" element={<Suspense fallback={<LoadingFallback />}><StoreLocator /></Suspense>} />
              <Route path="/privacy-policy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPolicy /></Suspense>} />
              <Route path="/terms-of-service" element={<Suspense fallback={<LoadingFallback />}><TermsOfService /></Suspense>} />
              <Route path="/shipping-delivery" element={<Suspense fallback={<LoadingFallback />}><ShippingDelivery /></Suspense>} />
              <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth /></Suspense>} />
              <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><CustomerAuth /></Suspense>} />
              
              {/* Admin Routes - Lazy loaded, nested under protected layout */}
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
                
                {/* Product Edits */}
                <Route path="colors" element={<AdminColors />} />
                <Route path="sizes" element={<AdminSizes />} />
                <Route path="materials" element={<AdminMaterials />} />
                <Route path="size-guides" element={<AdminSizeGuides />} />
                <Route path="care-instructions" element={<AdminCareInstructions />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="brands" element={<AdminBrands />} />
                
                {/* Accounts */}
                <Route path="accounts" element={<AdminAccounts />} />
                <Route path="accounts-list" element={<AdminAccountsList />} />
                <Route path="income-categories" element={<AdminIncomeCategories />} />
                <Route path="expense-categories" element={<AdminExpenseCategories />} />
                
                {/* Customers */}
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="divisions" element={<AdminDivisions />} />
                <Route path="thanas" element={<AdminThanas />} />
                <Route path="customer-types" element={<AdminCustomerTypes />} />
                
                {/* Orders */}
                <Route path="orders" element={<AdminOrders />} />
                <Route path="payment-methods" element={<AdminPaymentMethods />} />
                <Route path="promo-codes" element={<AdminPromoCodes />} />
                <Route path="site-settings" element={<AdminSiteSettings />} />
              </Route>
              
              {/* 404 Catch-all - MUST be last */}
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
