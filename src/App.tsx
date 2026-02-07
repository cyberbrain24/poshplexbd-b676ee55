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
import CustomerAuth from "./pages/CustomerAuth";
import CustomerAccount from "./pages/CustomerAccount";
import OrderTracking from "./pages/OrderTracking";
import MyOrders from "./pages/MyOrders";

// Admin pages - direct imports
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
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
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminSEO from "./pages/admin/AdminSEO";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings";
import AdminSeedData from "./pages/admin/AdminSeedData";

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
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/account" element={<CustomerAccount />} />
                <Route path="/about/our-story" element={<OurStory />} />
                <Route path="/about/sustainability" element={<Sustainability />} />
                <Route path="/about/size-guide" element={<SizeGuide />} />
                <Route path="/about/customer-care" element={<CustomerCare />} />
                <Route path="/about/store-locator" element={<StoreLocator />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<CustomerAuth />} />
                
                {/* Admin Routes - Nested under protected layout */}
                <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="seo" element={<AdminSEO />} />
                  <Route path="site-settings" element={<AdminSiteSettings />} />
                  
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
                  <Route path="seed-data" element={<AdminSeedData />} />
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
