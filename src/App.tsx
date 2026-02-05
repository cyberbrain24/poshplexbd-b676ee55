import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

// Critical pages - loaded immediately
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded public pages
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OurStory = lazy(() => import("./pages/about/OurStory"));
const Sustainability = lazy(() => import("./pages/about/Sustainability"));
const SizeGuide = lazy(() => import("./pages/about/SizeGuide"));
const CustomerCare = lazy(() => import("./pages/about/CustomerCare"));
const StoreLocator = lazy(() => import("./pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Auth = lazy(() => import("./pages/Auth"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
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
const AdminSmsApi = lazy(() => import("./pages/admin/AdminSmsApi"));
const AdminSmsMarketing = lazy(() => import("./pages/admin/AdminSmsMarketing"));
const AdminEmailApi = lazy(() => import("./pages/admin/AdminEmailApi"));
const AdminEmailMarketing = lazy(() => import("./pages/admin/AdminEmailMarketing"));
const AdminWhatsappApi = lazy(() => import("./pages/admin/AdminWhatsappApi"));
const AdminWhatsappMarketing = lazy(() => import("./pages/admin/AdminWhatsappMarketing"));
const AdminWhatsappInbox = lazy(() => import("./pages/admin/AdminWhatsappInbox"));
const AdminInstagramApi = lazy(() => import("./pages/admin/AdminInstagramApi"));
const AdminInstagramMarketing = lazy(() => import("./pages/admin/AdminInstagramMarketing"));
const AdminInstagramInbox = lazy(() => import("./pages/admin/AdminInstagramInbox"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;