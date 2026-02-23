import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const CategorySection = () => {
  const { data: categories = [], isLoading } = useCategories();
  const isMobile = useIsMobile();

  const mainCategories = categories.filter(c => !c.parent_id);

  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-6 py-8 md:py-12">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="shrink-0 w-[calc(25%-9px)] md:w-[calc(16.666%-10px)]">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-20 mt-2 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (mainCategories.length === 0) return null;

  // Mobile: carousel with 4 visible items
  if (isMobile) {
    return (
      <section className="w-full px-4 py-8">
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-5xl md:text-6xl font-black text-muted-foreground/30">01</span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground uppercase">Shop by Category</h2>
        </div>
        <Carousel opts={{ align: "start", loop: false }} className="w-full">
          <CarouselContent className="-ml-2">
            {mainCategories.map((category) => {
              const slug = category.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <CarouselItem key={category.id} className="basis-1/4 pl-2">
                  <Link to={`/category/${slug}`} className="block text-center">
                    <div className="aspect-square overflow-hidden rounded-xl bg-muted mx-auto shadow-lg">
                      <img
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-medium tracking-wide text-foreground uppercase mt-2 truncate">
                      {category.name}
                    </p>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </section>
    );
  }

  // Desktop: single row, all items visible
  return (
    <section className="w-full px-6 py-12">
      <div className="flex items-baseline gap-4 mb-8">
        <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">01</span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">Shop by Category</h2>
      </div>
      <div className="flex justify-center gap-6">
        {mainCategories.map((category) => {
          const slug = category.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <Link
              key={category.id}
              to={`/category/${slug}`}
              className="block w-[140px] text-center group"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-muted mx-auto shadow-lg">
                <img
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <p className="text-xs font-medium tracking-wide text-foreground uppercase mt-2 truncate">
                {category.name}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategorySection;
