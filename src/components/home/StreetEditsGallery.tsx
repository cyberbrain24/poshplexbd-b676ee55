import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";

const StreetEditsGallery = () => {
  const { data: categories = [], isLoading } = useCategories();
  
  // Get main categories (no parent) that have images, limit to 8
  const mainCategories = categories
    .filter(c => !c.parent_id && c.image_url)
    .slice(0, 8);

  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div className="relative">
            <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-black text-foreground/[0.03] leading-none select-none">
              EDIT
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground uppercase">
              Street Edits
            </h2>
            <div className="h-[2px] w-12 bg-foreground mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If no categories with images, don't render the section
  if (mainCategories.length === 0) {
    return null;
  }

  return (
    <section className="w-full px-4 md:px-8 py-12 md:py-16 bg-background relative overflow-hidden">
      {/* Background street element */}
      <div className="absolute bottom-0 right-0 text-[150px] md:text-[250px] font-black text-foreground/[0.015] leading-none select-none translate-x-1/4 translate-y-1/4">
        CULTURE
      </div>

      {/* Section Header */}
      <div className="flex items-end justify-between mb-8 md:mb-12 relative z-10">
        <div className="relative">
          <span className="absolute -left-2 -top-8 text-[80px] md:text-[120px] font-black text-foreground/[0.03] leading-none select-none">
            EDIT
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-[-0.02em] text-foreground uppercase">
            Street Edits
          </h2>
          <div className="h-[2px] w-12 bg-foreground mt-2" />
        </div>
      </div>

      {/* Category Grid */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 relative z-10">
        {mainCategories.map((category, index) => {
          const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <Link 
              key={category.id}
              to={`/category/${categorySlug}`}
              className="group block w-[calc(50%-6px)] sm:w-[calc(25%-9px)] lg:w-[calc(12.5%-10.5px)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden mb-3 bg-muted">
                {/* Category Image */}
                <img 
                  src={category.image_url!}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                
                {/* Index number */}
                <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/60 tracking-wider mix-blend-difference">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              
              {/* Category Name */}
              <h3 className="text-[11px] md:text-xs font-bold tracking-[0.1em] text-foreground uppercase group-hover:underline underline-offset-2">
                {category.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default StreetEditsGallery;
