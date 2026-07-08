import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "./components/ScrollToTop";
import { CartProvider } from "./contexts/CartContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { MusicPlayerProvider } from "./contexts/MusicPlayerContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import MobileFooterNav from "./components/navigation/MobileFooterNav";
import TypographyProvider from "./components/TypographyProvider";
import DeferredMount from "./components/perf/DeferredMount";
import { useIsMobile } from "./hooks/use-mobile";

// Non-critical: defer past first paint to lower LCP/TBT on landing pages
const FacebookPixelTracker = lazy(() => import("./components/tracking/FacebookPixelTracker"));
const GoogleAnalyticsTracker = lazy(() => import("./components/tracking/GoogleAnalyticsTracker"));
const FloatingMusicPlayer = lazy(() => import("./components/music/FloatingMusicPlayer"));



// Storefront routes (all public /*, /category/*, /product/*, /account, etc.)
// and the admin sub-app live inside this single entry so App.tsx only wires
// providers. Makes it obvious what ships to the frontend host (Vercel).
const StorefrontRoutes = lazy(() => import("./apps/storefront/StorefrontRoutes"));




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

// Desktop-only widgets — skip the chunk download entirely on mobile
const DesktopOnlyWidgets = () => {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <FloatingMusicPlayer />;
};


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
                <DeferredMount>
                  <Suspense fallback={null}>
                    <FacebookPixelTracker />
                    <GoogleAnalyticsTracker />
                  </Suspense>
                </DeferredMount>
                <Suspense fallback={<LoadingFallback />}>
                  <StorefrontRoutes />
                </Suspense>

                <MobileFooterNav />
                <DeferredMount delay={1500}>
                  <Suspense fallback={null}>
                    <DesktopOnlyWidgets />
                  </Suspense>
                </DeferredMount>
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
