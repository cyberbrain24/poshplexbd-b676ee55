import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./contexts/CartContext";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
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
              <Route path="/" element={<Index />} />
              <Route path="/category/:category" element={<Category />} />
              <Route path="/product/:productId" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
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
              
              {/* Admin Routes - Protected */}
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
              <Route path="/admin/colors" element={<ProtectedRoute><AdminColors /></ProtectedRoute>} />
              <Route path="/admin/sizes" element={<ProtectedRoute><AdminSizes /></ProtectedRoute>} />
              <Route path="/admin/materials" element={<ProtectedRoute><AdminMaterials /></ProtectedRoute>} />
              <Route path="/admin/size-guides" element={<ProtectedRoute><AdminSizeGuides /></ProtectedRoute>} />
              <Route path="/admin/care-instructions" element={<ProtectedRoute><AdminCareInstructions /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/brands" element={<ProtectedRoute><AdminBrands /></ProtectedRoute>} />
              <Route path="/admin/accounts" element={<ProtectedRoute><AdminAccounts /></ProtectedRoute>} />
              <Route path="/admin/accounts-list" element={<ProtectedRoute><AdminAccountsList /></ProtectedRoute>} />
              <Route path="/admin/income-categories" element={<ProtectedRoute><AdminIncomeCategories /></ProtectedRoute>} />
              <Route path="/admin/expense-categories" element={<ProtectedRoute><AdminExpenseCategories /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/divisions" element={<ProtectedRoute><AdminDivisions /></ProtectedRoute>} />
              <Route path="/admin/thanas" element={<ProtectedRoute><AdminThanas /></ProtectedRoute>} />
              <Route path="/admin/customer-types" element={<ProtectedRoute><AdminCustomerTypes /></ProtectedRoute>} />
              <Route path="/admin/sms-api" element={<ProtectedRoute><AdminSmsApi /></ProtectedRoute>} />
              <Route path="/admin/sms-marketing" element={<ProtectedRoute><AdminSmsMarketing /></ProtectedRoute>} />
              <Route path="/admin/email-api" element={<ProtectedRoute><AdminEmailApi /></ProtectedRoute>} />
              <Route path="/admin/email-marketing" element={<ProtectedRoute><AdminEmailMarketing /></ProtectedRoute>} />
              <Route path="/admin/whatsapp-api" element={<ProtectedRoute><AdminWhatsappApi /></ProtectedRoute>} />
              <Route path="/admin/whatsapp-marketing" element={<ProtectedRoute><AdminWhatsappMarketing /></ProtectedRoute>} />
              <Route path="/admin/whatsapp-inbox" element={<ProtectedRoute><AdminWhatsappInbox /></ProtectedRoute>} />
              <Route path="/admin/instagram-api" element={<ProtectedRoute><AdminInstagramApi /></ProtectedRoute>} />
              <Route path="/admin/instagram-marketing" element={<ProtectedRoute><AdminInstagramMarketing /></ProtectedRoute>} />
              <Route path="/admin/instagram-inbox" element={<ProtectedRoute><AdminInstagramInbox /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
