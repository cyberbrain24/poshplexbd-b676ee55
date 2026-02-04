import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import streetEdit1 from "@/assets/street-edit-1.jpg";
import streetEdit2 from "@/assets/street-edit-2.jpg";
import streetEdit3 from "@/assets/street-edit-3.jpg";

const StreetEditsGallery = () => {
  const images = [
    { src: streetEdit1, alt: "Male model in streetwear", href: "/category/men" },
    { src: streetEdit2, alt: "Female model in streetwear", href: "/category/women" },
    { src: streetEdit3, alt: "Streetwear detail", href: "/category/new-drops" },
  ];

  return (
    <section className="w-full px-6 py-20">
      {/* Section Header */}
      <div className="flex items-baseline gap-4 mb-10">
        <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">
          01
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
          STREET EDITS
        </h2>
      </div>

      {/* Asymmetric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Large left image */}
        <Link 
          to={images[0].href}
          className="md:col-span-5 relative group overflow-hidden"
        >
          <div className="aspect-[3/4]">
            <img 
              src={images[0].src}
              alt={images[0].alt}
              className="w-full h-full object-cover grayscale-filter group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-background bg-foreground/80 px-4 py-2 text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
            SHOP MEN
            <ArrowRight size={14} strokeWidth={1.5} />
          </div>
        </Link>

        {/* Right column with 2 stacked images */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <Link 
            to={images[1].href}
            className="relative group overflow-hidden flex-1"
          >
            <div className="aspect-[3/4]">
              <img 
                src={images[1].src}
                alt={images[1].alt}
                className="w-full h-full object-cover grayscale-filter group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-background bg-foreground/80 px-4 py-2 text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
              SHOP WOMEN
              <ArrowRight size={14} strokeWidth={1.5} />
            </div>
          </Link>
        </div>

        {/* Detail shot */}
        <Link 
          to={images[2].href}
          className="md:col-span-3 relative group overflow-hidden"
        >
          <div className="aspect-[3/4]">
            <img 
              src={images[2].src}
              alt={images[2].alt}
              className="w-full h-full object-cover grayscale-filter group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-background bg-foreground/80 px-4 py-2 text-sm font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
            NEW DROPS
            <ArrowRight size={14} strokeWidth={1.5} />
          </div>
        </Link>
      </div>
    </section>
  );
};

export default StreetEditsGallery;