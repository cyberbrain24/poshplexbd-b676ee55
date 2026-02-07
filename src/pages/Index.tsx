import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import HeroSection from "../components/home/HeroSection";
import FeaturesBar from "../components/home/FeaturesBar";
import StreetEditsGallery from "../components/home/StreetEditsGallery";
import ProductGrid from "../components/home/ProductGrid";
import { HomeSEO } from "@/components/seo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HomeSEO />
      <PoshplexHeader />
      
      <main>
        <HeroSection />
        <FeaturesBar />
        <StreetEditsGallery />
        <ProductGrid />
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default Index;