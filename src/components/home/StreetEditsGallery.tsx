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
      <section className="w-full px-6 py-20">
        <div className="flex items-baseline gap-4 mb-10">
          <Skeleton className="w-24 h-16" />
          <Skeleton className="w-48 h-8" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-5 w-24" />
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

      {/* Category Grid - 8 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {mainCategories.map((category) => {
          const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <Link 
              key={category.id}
              to={`/category/${categorySlug}`}
              className="group block"
            >
              <div className="aspect-[3/4] overflow-hidden mb-3">
                <img 
                  src={category.image_url!}
                  alt={category.name}
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
              </div>
              <h3 className="text-sm font-medium tracking-wide text-foreground uppercase">
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
