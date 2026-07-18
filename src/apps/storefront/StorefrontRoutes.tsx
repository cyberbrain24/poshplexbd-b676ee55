import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import NotFound from "@/pages/NotFound";
import HomeSkeleton from "@/components/skeletons/HomeSkeleton";
import CategorySkeleton from "@/components/skeletons/CategorySkeleton";
import ProductDetailSkeleton from "@/components/skeletons/ProductDetailSkeleton";

// Storefront pages - lazy loaded so landing on /category or /product
// does not pull the Home-page chunk (and vice versa)
const Index = lazy(() => import("@/pages/Index"));
const Category = lazy(() => import("@/pages/Category"));
const CategoryBrowser = lazy(() => import("@/pages/CategoryBrowser"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OurStory = lazy(() => import("@/pages/about/OurStory"));
const StoreLocator = lazy(() => import("@/pages/about/StoreLocator"));
const PrivacyPolicy = lazy(() => import("@/pages/about/PrivacyPolicy"));
const TermsConditions = lazy(() => import("@/pages/about/TermsConditions"));
const ShippingDelivery = lazy(() => import("@/pages/about/ShippingDelivery"));
const Auth = lazy(() => import("@/pages/Auth"));
const CustomerAuth = lazy(() => import("@/pages/CustomerAuth"));
const CompleteProfile = lazy(() => import("@/pages/CompleteProfile"));
const CustomerAccount = lazy(() => import("@/pages/CustomerAccount"));
const OrderTracking = lazy(() => import("@/pages/OrderTracking"));
const MyOrders = lazy(() => import("@/pages/MyOrders"));
const Membership = lazy(() => import("@/pages/Membership"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const CustomerReviews = lazy(() => import("@/pages/CustomerReviews"));

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const AdminRouteLoader = () => {
  const [AdminApp, setAdminApp] = useState<ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    import("@/apps/admin/AdminApp").then((module) => {
      if (mounted) setAdminApp(() => module.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!AdminApp) return <LoadingFallback />;

  return <AdminApp />;
};

const StorefrontRoutes = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return <AdminRouteLoader />;
  }

  return (
    <Routes>
    <Route path="/" element={<Suspense fallback={<HomeSkeleton />}><Index /></Suspense>} />
    <Route path="/categories" element={<Suspense fallback={<CategorySkeleton />}><CategoryBrowser /></Suspense>} />
    <Route path="/category/:category" element={<Suspense fallback={<CategorySkeleton />}><Category /></Suspense>} />
    <Route path="/product/:productSlug" element={<Suspense fallback={<ProductDetailSkeleton />}><ProductDetail /></Suspense>} />
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

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default StorefrontRoutes;
