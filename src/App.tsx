import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SpeedInsights } from "@vercel/speed-insights/react";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./contexts/CartContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MobileFooterNav from "./components/navigation/MobileFooterNav";
import TypographyProvider from "./components/TypographyProvider";
import DeferredMount from "./components/perf/DeferredMount";
import StorefrontRoutes from "./apps/storefront/StorefrontRoutes";

// Non-critical: defer past first paint to lower LCP/TBT on landing pages
const FacebookPixelTracker = lazy(() => import("./components/tracking/FacebookPixelTracker"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 1,
      throwOnError: false,
    },
  },
});

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
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SpeedInsights />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <ScrollToTop />
                <TypographyProvider />
                <DeferredMount>
                  <Suspense fallback={null}>
                    <FacebookPixelTracker />
                  </Suspense>
                </DeferredMount>
                <StorefrontRoutes />

                <MobileFooterNav />
              </BrowserRouter>
            </TooltipProvider>
          </FavoritesProvider>
        </CartProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
