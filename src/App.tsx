import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./contexts/CartContext";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import { ModulesProvider } from "./contexts/ModulesContext";
import AdminLayout from "./components/admin/AdminLayout";
import ModuleGuard from "./components/admin/ModuleGuard";

// All pages - direct imports (no lazy loading)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OurStory from "./pages/about/OurStory";
import Sustainability from "./pages/about/Sustainability";
import SizeGuide from "./pages/about/SizeGuide";
import CustomerCare from "./pages/about/CustomerCare";
import StoreLocator from "./pages/about/StoreLocator";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Auth from "./pages/Auth";
import OrderTracking from "./pages/OrderTracking";

// Admin pages - direct imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminModules from "./pages/admin/AdminModules";

import AdminColors from "./pages/admin/AdminColors";
import AdminSizes from "./pages/admin/AdminSizes";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminSizeGuides from "./pages/admin/AdminSizeGuides";
import AdminCareInstructions from "./pages/admin/AdminCareInstructions";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBrands from "./pages/admin/AdminBrands";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminAccountsList from "./pages/admin/AdminAccountsList";
import AdminIncomeCategories from "./pages/admin/AdminIncomeCategories";
import AdminExpenseCategories from "./pages/admin/AdminExpenseCategories";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminDivisions from "./pages/admin/AdminDivisions";
import AdminThanas from "./pages/admin/AdminThanas";
import AdminCustomerTypes from "./pages/admin/AdminCustomerTypes";
import AdminSmsApi from "./pages/admin/AdminSmsApi";
import AdminSmsMarketing from "./pages/admin/AdminSmsMarketing";
import AdminEmailApi from "./pages/admin/AdminEmailApi";
import AdminEmailMarketing from "./pages/admin/AdminEmailMarketing";
import AdminWhatsappApi from "./pages/admin/AdminWhatsappApi";
import AdminWhatsappMarketing from "./pages/admin/AdminWhatsappMarketing";
import AdminWhatsappInbox from "./pages/admin/AdminWhatsappInbox";
import AdminInstagramApi from "./pages/admin/AdminInstagramApi";
import AdminInstagramMarketing from "./pages/admin/AdminInstagramMarketing";
import AdminInstagramInbox from "./pages/admin/AdminInstagramInbox";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminVerificationQueue from "./pages/admin/AdminVerificationQueue";
import AdminReturns from "./pages/admin/AdminReturns";
import AdminRiskManagement from "./pages/admin/AdminRiskManagement";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminSEO from "./pages/admin/AdminSEO";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";

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

// Wrapper component for module-guarded routes
const GuardedRoute = ({ children }: { children: React.ReactNode }) => (
  <ModuleGuard>{children}</ModuleGuard>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider>
        <ModulesProvider>
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
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/category/:category" element={<Category />} />
                  <Route path="/product/:productId" element={<ProductDetail />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-tracking" element={<OrderTracking />} />
                  <Route path="/about/our-story" element={<OurStory />} />
                  <Route path="/about/sustainability" element={<Sustainability />} />
                  <Route path="/about/size-guide" element={<SizeGuide />} />
                  <Route path="/about/customer-care" element={<CustomerCare />} />
                  <Route path="/about/store-locator" element={<StoreLocator />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Admin Routes - Nested under protected layout */}
                  <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                    {/* Core modules (always accessible) */}
                    <Route index element={<AdminDashboard />} />
                    <Route path="modules" element={<AdminModules />} />
                    
                    {/* Module-guarded routes */}
                    <Route path="products" element={<GuardedRoute><AdminProducts /></GuardedRoute>} />
                    <Route path="seo" element={<GuardedRoute><AdminSEO /></GuardedRoute>} />
                    <Route path="site-settings" element={<GuardedRoute><AdminSiteSettings /></GuardedRoute>} />
                    
                    {/* Product Edits */}
                    <Route path="colors" element={<GuardedRoute><AdminColors /></GuardedRoute>} />
                    <Route path="sizes" element={<GuardedRoute><AdminSizes /></GuardedRoute>} />
                    <Route path="materials" element={<GuardedRoute><AdminMaterials /></GuardedRoute>} />
                    <Route path="size-guides" element={<GuardedRoute><AdminSizeGuides /></GuardedRoute>} />
                    <Route path="care-instructions" element={<GuardedRoute><AdminCareInstructions /></GuardedRoute>} />
                    <Route path="categories" element={<GuardedRoute><AdminCategories /></GuardedRoute>} />
                    <Route path="brands" element={<GuardedRoute><AdminBrands /></GuardedRoute>} />
                    
                    {/* Accounts */}
                    <Route path="accounts" element={<GuardedRoute><AdminAccounts /></GuardedRoute>} />
                    <Route path="accounts-list" element={<GuardedRoute><AdminAccountsList /></GuardedRoute>} />
                    <Route path="income-categories" element={<GuardedRoute><AdminIncomeCategories /></GuardedRoute>} />
                    <Route path="expense-categories" element={<GuardedRoute><AdminExpenseCategories /></GuardedRoute>} />
                    
                    {/* Customers */}
                    <Route path="customers" element={<GuardedRoute><AdminCustomers /></GuardedRoute>} />
                    <Route path="divisions" element={<GuardedRoute><AdminDivisions /></GuardedRoute>} />
                    <Route path="thanas" element={<GuardedRoute><AdminThanas /></GuardedRoute>} />
                    <Route path="customer-types" element={<GuardedRoute><AdminCustomerTypes /></GuardedRoute>} />
                    
                    {/* Marketing */}
                    <Route path="sms-api" element={<GuardedRoute><AdminSmsApi /></GuardedRoute>} />
                    <Route path="sms-marketing" element={<GuardedRoute><AdminSmsMarketing /></GuardedRoute>} />
                    <Route path="email-api" element={<GuardedRoute><AdminEmailApi /></GuardedRoute>} />
                    <Route path="email-marketing" element={<GuardedRoute><AdminEmailMarketing /></GuardedRoute>} />
                    <Route path="whatsapp-api" element={<GuardedRoute><AdminWhatsappApi /></GuardedRoute>} />
                    <Route path="whatsapp-marketing" element={<GuardedRoute><AdminWhatsappMarketing /></GuardedRoute>} />
                    <Route path="whatsapp-inbox" element={<GuardedRoute><AdminWhatsappInbox /></GuardedRoute>} />
                    <Route path="instagram-api" element={<GuardedRoute><AdminInstagramApi /></GuardedRoute>} />
                    <Route path="instagram-marketing" element={<GuardedRoute><AdminInstagramMarketing /></GuardedRoute>} />
                    <Route path="instagram-inbox" element={<GuardedRoute><AdminInstagramInbox /></GuardedRoute>} />
                    
                    {/* Orders */}
                    <Route path="orders" element={<GuardedRoute><AdminOrders /></GuardedRoute>} />
                    <Route path="verification-queue" element={<GuardedRoute><AdminVerificationQueue /></GuardedRoute>} />
                    <Route path="returns" element={<GuardedRoute><AdminReturns /></GuardedRoute>} />
                    <Route path="risk-management" element={<GuardedRoute><AdminRiskManagement /></GuardedRoute>} />
                    <Route path="payment-methods" element={<GuardedRoute><AdminPaymentMethods /></GuardedRoute>} />
                    <Route path="inventory" element={<GuardedRoute><AdminInventory /></GuardedRoute>} />
                  </Route>
                  
                  {/* 404 Catch-all - MUST be last */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </ModulesProvider>
      </SiteSettingsProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
