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
import AdminLayout from "./components/admin/AdminLayout";

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
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import OrderTracking from "./pages/OrderTracking";

// Admin pages - direct imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBlog from "./pages/admin/AdminBlog";
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
import AdminPages from "./pages/admin/AdminPages";
import DynamicPage from "./pages/DynamicPage";

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

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <SiteSettingsProvider>
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
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                
                {/* Dynamic CMS Pages */}
                <Route path="/page/:slug" element={<DynamicPage />} />
                
                {/* Admin Routes - Nested under protected layout */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="blog" element={<AdminBlog />} />
                  <Route path="seo" element={<AdminSEO />} />
                  <Route path="site-settings" element={<AdminSiteSettings />} />
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
                  <Route path="sms-api" element={<AdminSmsApi />} />
                  <Route path="sms-marketing" element={<AdminSmsMarketing />} />
                  <Route path="email-api" element={<AdminEmailApi />} />
                  <Route path="email-marketing" element={<AdminEmailMarketing />} />
                  <Route path="whatsapp-api" element={<AdminWhatsappApi />} />
                  <Route path="whatsapp-marketing" element={<AdminWhatsappMarketing />} />
                  <Route path="whatsapp-inbox" element={<AdminWhatsappInbox />} />
                  <Route path="instagram-api" element={<AdminInstagramApi />} />
                  <Route path="instagram-marketing" element={<AdminInstagramMarketing />} />
                  <Route path="instagram-inbox" element={<AdminInstagramInbox />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="verification-queue" element={<AdminVerificationQueue />} />
                  <Route path="returns" element={<AdminReturns />} />
                  <Route path="risk-management" element={<AdminRiskManagement />} />
                  <Route path="payment-methods" element={<AdminPaymentMethods />} />
                  <Route path="inventory" element={<AdminInventory />} />
                  <Route path="pages" element={<AdminPages />} />
                </Route>
                
                {/* 404 Catch-all - MUST be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </SiteSettingsProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
