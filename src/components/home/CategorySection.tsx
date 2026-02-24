import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const CategorySection = () => {
  const { data: categories = [], isLoading } = useCategories();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollNext, setCanScrollNext] = useState(false);

  const mainCategories = categories.filter(c => !c.parent_id);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCanScrollNext(api.canScrollNext());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  if (isLoading) {
    return (
      <section className="w-full px-4 md:px-6 py-8 md:py-12">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="shrink-0 w-[calc(25%-9px)] md:w-[calc(16.666%-10px)]">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-20 mt-2 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (mainCategories.length === 0) return null;

  // Mobile: carousel with swipe hint
  if (isMobile) {
    return (
      <section className="w-full px-4 py-8">
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-5xl font-black text-muted-foreground/30">01</span>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Shop by Category</h2>
        </div>
        <Carousel opts={{ align: "start", loop: false }} setApi={setApi} className="w-full">
          <CarouselContent className="-ml-2">
            {mainCategories.map((category) => {
              const slug = category.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <CarouselItem key={category.id} className="basis-1/4 pl-2">
                  <Link to={`/category/${slug}`} className="block text-center">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-muted mx-auto shadow-md">
                      <img
                        src={category.image_url || "/placeholder.svg"}
                        alt={category.name}
                        width={100}
                        height={100}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[9px] font-medium tracking-wide text-foreground uppercase mt-1.5 leading-tight text-center">
                      {category.name}
                    </p>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
        {canScrollNext && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Swipe</span>
            <span className="text-muted-foreground text-xs">→</span>
          </div>
        )}
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
      <div className="flex justify-center gap-4 md:gap-6">
        {mainCategories.map((category) => {
          const slug = category.name.toLowerCase().replace(/\s+/g, "-");
          return (
            <Link
              key={category.id}
              to={`/category/${slug}`}
              className="block w-[150px] lg:w-[200px] text-center group"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-muted mx-auto" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15), 0 -2px 6px rgba(0,0,0,0.06)' }}>
                <img
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  width={200}
                  height={200}
                  loading="lazy"
                  decoding="async"
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
