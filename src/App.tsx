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
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MobileFooterNav from "./components/navigation/MobileFooterNav";
import FacebookPixelTracker from "./components/tracking/FacebookPixelTracker";
import VisitorTracker from "./components/tracking/VisitorTracker";
import FloatingMusicPlayer from "./components/music/FloatingMusicPlayer";
import TypographyProvider from "./components/TypographyProvider";
import FloatingPromotion from "./components/promotions/FloatingPromotion";


// Storefront pages - eagerly loaded (critical path)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Storefront pages - lazy loaded (non-critical)
const Category = lazy(() => import("./pages/Category"));
const CategoryBrowser = lazy(() => import("./pages/CategoryBrowser"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/about/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/about/TermsConditions"));
const ShippingDelivery = lazy(() => import("./pages/about/ShippingDelivery"));
const Auth = lazy(() => import("./pages/Auth"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const CustomerAccount = lazy(() => import("./pages/CustomerAccount"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Membership = lazy(() => import("./pages/Membership"));
const Favorites = lazy(() => import("./pages/Favorites"));
const CustomerReviews = lazy(() => import("./pages/CustomerReviews"));

// Admin pages - lazy loaded (separate chunk, never downloaded by storefront users)
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminAIAssistant = lazy(() => import("./pages/admin/AdminAIAssistant"));
const AdminColors = lazy(() => import("./pages/admin/AdminColors"));
const AdminSizes = lazy(() => import("./pages/admin/AdminSizes"));
const AdminMaterials = lazy(() => import("./pages/admin/AdminMaterials"));
const AdminCustomVariants = lazy(() => import("./pages/admin/AdminCustomVariants"));
const AdminProductAttributes = lazy(() => import("./pages/admin/AdminProductAttributes"));
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
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminSiteSettings = lazy(() => import("./pages/admin/AdminSiteSettings"));
const AdminBulkUpload = lazy(() => import("./pages/admin/AdminBulkUpload"));
const AdminMusic = lazy(() => import("./pages/admin/AdminMusic"));
const AdminSMS = lazy(() => import("./pages/admin/AdminSMS"));
const AdminEmail = lazy(() => import("./pages/admin/AdminEmail"));
const EmailUnsubscribe = lazy(() => import("./pages/EmailUnsubscribe"));

const AdminNotes = lazy(() => import("./pages/admin/AdminNotes"));
const MarketingLayout = lazy(() => import("./pages/admin/marketing/MarketingLayout"));
const MarketingOverview = lazy(() => import("./pages/admin/marketing/MarketingOverview"));
const MetaPixelSettings = lazy(() => import("./pages/admin/marketing/MetaPixelSettings"));
const MetaCapiSettings = lazy(() => import("./pages/admin/marketing/MetaCapiSettings"));
const GA4Settings = lazy(() => import("./pages/admin/marketing/GA4Settings"));
const VisitorAnalytics = lazy(() => import("./pages/admin/marketing/VisitorAnalytics"));
const AIProviderCredentials = lazy(() => import("./pages/admin/marketing/AIProviderCredentials"));
const SteadfastSettings = lazy(() => import("./pages/admin/marketing/SteadfastSettings"));
const DocsIndex = lazy(() => import("./pages/admin/docs/DocsIndex"));
const DocPage = lazy(() => import("./pages/admin/docs/DocPage"));
const ReportsOverview = lazy(() => import("./pages/admin/reports/ReportsOverview"));
const OrdersReport = lazy(() => import("./pages/admin/reports/OrdersReport"));
const FinancialReport = lazy(() => import("./pages/admin/reports/FinancialReport"));
const CustomersReport = lazy(() => import("./pages/admin/reports/CustomersReport"));
const ProductsReport = lazy(() => import("./pages/admin/reports/ProductsReport"));
const InventoryReport = lazy(() => import("./pages/admin/reports/InventoryReport"));
const PromosReport = lazy(() => import("./pages/admin/reports/PromosReport"));
const ReviewsReport = lazy(() => import("./pages/admin/reports/ReviewsReport"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: false,
      // placeholderData removed globally — apply per-query where needed
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
          <FavoritesProvider>
            <MusicPlayerProvider>
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
                <TypographyProvider />
                <FacebookPixelTracker />
                <VisitorTracker />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/categories" element={<Suspense fallback={<LoadingFallback />}><CategoryBrowser /></Suspense>} />
                  <Route path="/category/:category" element={<Suspense fallback={<LoadingFallback />}><Category /></Suspense>} />
                  <Route path="/product/:productSlug" element={<Suspense fallback={<LoadingFallback />}><ProductDetail /></Suspense>} />
                  <Route path="/checkout" element={<Suspense fallback={<LoadingFallback />}><Checkout /></Suspense>} />
                  <Route path="/order-tracking" element={<Suspense fallback={<LoadingFallback />}><OrderTracking /></Suspense>} />
                  <Route path="/my-orders" element={<Suspense fallback={<LoadingFallback />}><MyOrders /></Suspense>} />
                  <Route path="/account" element={<Suspense fallback={<LoadingFallback />}><CustomerAccount /></Suspense>} />
                  <Route path="/favorites" element={<Suspense fallback={<LoadingFallback />}><Favorites /></Suspense>} />
                  <Route path="/membership" element={<Suspense fallback={<LoadingFallback />}><Membership /></Suspense>} />
                  <Route path="/reviews" element={<Suspense fallback={<LoadingFallback />}><CustomerReviews /></Suspense>} />
                  <Route path="/pages/our-story" element={<Suspense fallback={<LoadingFallback />}><OurStory /></Suspense>} />
                  <Route path="/pages/store-locator" element={<Suspense fallback={<LoadingFallback />}><StoreLocator /></Suspense>} />
                  <Route path="/pages/privacy-policy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPolicy /></Suspense>} />
                  <Route path="/pages/terms-conditions" element={<Suspense fallback={<LoadingFallback />}><TermsConditions /></Suspense>} />
                  <Route path="/pages/shipping-delivery" element={<Suspense fallback={<LoadingFallback />}><ShippingDelivery /></Suspense>} />
                  <Route path="/about/*" element={<Suspense fallback={<LoadingFallback />}><OurStory /></Suspense>} />
                  <Route path="/privacy-policy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPolicy /></Suspense>} />
                  <Route path="/terms-of-service" element={<Suspense fallback={<LoadingFallback />}><TermsConditions /></Suspense>} />
                  <Route path="/shipping-delivery" element={<Suspense fallback={<LoadingFallback />}><ShippingDelivery /></Suspense>} />
                  <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth /></Suspense>} />
                  <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><CustomerAuth /></Suspense>} />
                  <Route path="/complete-profile" element={<Suspense fallback={<LoadingFallback />}><CompleteProfile /></Suspense>} />
                 <Route path="/email/unsubscribe" element={<Suspense fallback={<LoadingFallback />}><EmailUnsubscribe /></Suspense>} />
                  
                  
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
                    <Route path="ai-assistant" element={<AdminAIAssistant />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="media" element={<AdminMedia />} />
                    <Route path="colors" element={<AdminColors />} />
                    <Route path="sizes" element={<AdminSizes />} />
                    <Route path="materials" element={<AdminMaterials />} />
                    <Route path="custom-variants" element={<AdminCustomVariants />} />
                    <Route path="product-attributes" element={<AdminProductAttributes />} />
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
                    <Route path="promotions" element={<AdminPromotions />} />
                    <Route path="bulk-upload" element={<AdminBulkUpload />} />
                    <Route path="music" element={<AdminMusic />} />
                    <Route path="sms" element={<AdminSMS />} />
                    <Route path="email" element={<AdminEmail />} />
                    <Route path="notes" element={<AdminNotes />} />
                    <Route path="site-settings" element={<AdminSiteSettings />} />
                    <Route path="marketing" element={<MarketingLayout />}>
                      <Route index element={<MarketingOverview />} />
                      <Route path="meta-pixel" element={<MetaPixelSettings />} />
                      <Route path="meta-capi" element={<MetaCapiSettings />} />
                      <Route path="ga4" element={<GA4Settings />} />
                      <Route path="visitors" element={<VisitorAnalytics />} />
                      <Route path="ai-providers" element={<AIProviderCredentials />} />
                      <Route path="steadfast" element={<SteadfastSettings />} />
                    </Route>
                    <Route path="docs" element={<DocsIndex />} />
                    <Route path="docs/:slug" element={<DocPage />} />
                    <Route path="reports" element={<ReportsOverview />} />
                    <Route path="reports/orders" element={<OrdersReport />} />
                    <Route path="reports/financial" element={<FinancialReport />} />
                    <Route path="reports/customers" element={<CustomersReport />} />
                    <Route path="reports/products" element={<ProductsReport />} />
                    <Route path="reports/inventory" element={<InventoryReport />} />
                    <Route path="reports/promos" element={<PromosReport />} />
                    <Route path="reports/reviews" element={<ReviewsReport />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileFooterNav />
                <FloatingMusicPlayer />
                <FloatingPromotion />
              </BrowserRouter>
            </TooltipProvider>
            </MusicPlayerProvider>
          </FavoritesProvider>
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
