import { lazy, Suspense } from "react";

import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import HeroSection from "../components/home/HeroSection";
import FeaturesBar from "../components/home/FeaturesBar";
import LazyOnVisible from "../components/perf/LazyOnVisible";
import { useStorefrontPrefetch } from "@/hooks/useStorefrontPrefetch";

// Lazy-load below-fold sections to reduce initial bundle
const CategorySection = lazy(() => import("../components/home/CategorySection"));
const FeaturedProducts = lazy(() => import("../components/home/FeaturedProducts"));
const ProductGrid = lazy(() => import("../components/home/ProductGrid"));
const OurStorySection = lazy(() => import("../components/home/OurStorySection"));
const CustomerReviewsSection = lazy(() => import("../components/home/CustomerReviewsSection"));
const HomeSEO = lazy(() => import("@/components/seo/HomeSEO"));

// Reserving space in fallbacks to prevent CLS when lazy sections load
const GridFallback = () => (
  <div className="w-full px-4 md:px-8 py-12 md:py-16" style={{ minHeight: 600 }} />
);
const GalleryFallback = () => (
  <div className="w-full px-6 py-20" style={{ minHeight: 400 }} />
);
const StoryFallback = () => (
  <div className="pt-12 md:pt-16 pb-0" style={{ minHeight: 200 }} />
);

const Index = () => {
  useStorefrontPrefetch();
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <HomeSEO />
      </Suspense>
      <PoshplexHeader />
      
      <main className="-mt-[1px]">
        <HeroSection />
        <div className="px-4 md:px-8 mt-4"><PromotionSlot placement="home_top" /></div>
        <Suspense fallback={<GalleryFallback />}>
          <CategorySection />
        </Suspense>
        <LazyOnVisible minHeight={600}>
          <Suspense fallback={<GridFallback />}>
            <FeaturedProducts />
          </Suspense>
        </LazyOnVisible>
        <LazyOnVisible minHeight={120}>
          <div className="px-4 md:px-8 my-8"><PromotionSlot placement="home_middle" /></div>
        </LazyOnVisible>
        <LazyOnVisible minHeight={600}>
          <Suspense fallback={<GridFallback />}>
            <ProductGrid />
          </Suspense>
        </LazyOnVisible>
        <LazyOnVisible minHeight={400}>
          <Suspense fallback={<GridFallback />}>
            <CustomerReviewsSection />
          </Suspense>
        </LazyOnVisible>
        <LazyOnVisible minHeight={200}>
          <Suspense fallback={<StoryFallback />}>
            <OurStorySection />
          </Suspense>
        </LazyOnVisible>
        <LazyOnVisible minHeight={120}>
          <div className="px-4 md:px-8 my-8"><PromotionSlot placement="home_bottom" /></div>
        </LazyOnVisible>
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default Index;
