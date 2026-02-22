import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";

const StreetEditsGallery = () => {
  const { data: categories = [], isLoading } = useCategories();
  
  const mainCategories = categories
    .filter(c => !c.parent_id && c.image_url)
    .slice(0, 8);

  if (isLoading) {
    return (
      <section className="w-full px-6 py-20" style={{ minHeight: 400 }}>
        <div className="flex items-baseline gap-4 mb-10">
          <Skeleton className="w-24 h-16" />
          <Skeleton className="w-48 h-8" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (mainCategories.length === 0) return null;

  return (
    <section className="w-full px-6 py-20" style={{ minHeight: 400 }}>
      <div className="flex items-baseline gap-4 mb-10">
        <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">01</span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">STREET EDITS</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {mainCategories.map((category, index) => {
          const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
          return (
            <Link 
              key={category.id}
              to={`/category/${categorySlug}`}
              className="block w-[calc(25%-12px)] lg:w-[calc(12.5%-14px)]"
            >
              <div className="aspect-[3/4] overflow-hidden mb-3">
                <img 
                  src={category.image_url!}
                  alt={category.name}
                  width={200}
                  height={267}
                  loading={index < 4 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
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
