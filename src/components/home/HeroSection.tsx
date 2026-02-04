import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-urban.jpg";

const HeroSection = () => {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[70vh]">
        {/* Left Content */}
        <div className="flex flex-col justify-center px-6 lg:px-16 py-16 lg:py-0">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
            SHOP THE LATEST<br />
            STREETCULTURE<br />
            & APPAREL.
          </h1>
          
          <p className="text-muted-foreground text-base md:text-lg mb-8 max-w-md">
            Free delivery inside Dhaka. Cash on Delivery available nationwide.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/category/new-drops"
              className="inline-flex items-center gap-3 bg-foreground text-background px-8 py-4 text-sm font-medium tracking-wider hover:bg-primary-hover transition-colors"
            >
              SHOP NOW
              <ArrowRight size={18} strokeWidth={1.5} />
            </Link>
            
            <Link 
              to="/category/sale"
              className="inline-flex items-center gap-3 bg-background text-foreground border border-foreground px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground hover:text-background transition-colors"
            >
              VIEW OFFERS
            </Link>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative h-[50vh] lg:h-auto">
          <img 
            src={heroImage}
            alt="Urban architecture"
            className="w-full h-full object-cover grayscale-filter"
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;