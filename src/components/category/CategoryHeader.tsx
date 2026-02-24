import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface CategoryHeaderProps {
  category: string;
  categorySlug?: string;
}

const CategoryHeader = ({ category, categorySlug }: CategoryHeaderProps) => {
  const { data: categories = [] } = useCategories();
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollNext, setCanScrollNext] = useState(false);

  const currentCategory = categories.find(
    (c) => c.name.toLowerCase().replace(/\s+/g, "-") === categorySlug
  );

  const subcategories = currentCategory
    ? categories.filter((c) => c.parent_id === currentCategory.id)
    : [];

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCanScrollNext(api.canScrollNext());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  return (
    <section className="w-full px-4 md:px-6 mb-1">
      <h1 className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
        {category}
      </h1>

      {subcategories.length > 0 && (
        <div className="mt-1">
          {isMobile ? (
            <>
              <Carousel opts={{ align: "start", loop: false }} setApi={setApi} className="w-full">
                <CarouselContent className="-ml-2">
                  {subcategories.map((sub) => {
                    const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <CarouselItem key={sub.id} className="basis-1/4 pl-2">
                        <Link
                          to={`/category/${slug}`}
                          className="relative aspect-square rounded-xl overflow-hidden group block"
                        >
                          {sub.image_url ? (
                            <img
                              src={sub.image_url}
                              alt={sub.name}
                              width={100}
                              height={100}
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-muted" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <span className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-semibold uppercase tracking-wider leading-tight">
                            {sub.name}
                          </span>
                        </Link>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
              {canScrollNext && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase">Swipe</span>
                  <span className="text-muted-foreground text-xs">→</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {subcategories.map((sub) => {
                const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={sub.id}
                    to={`/category/${slug}`}
                    className="group flex flex-col items-center gap-2 w-[120px]"
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
                      {sub.image_url ? (
                        <img
                          src={sub.image_url}
                          alt={sub.name}
                          width={120}
                          height={120}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-foreground group-hover:text-primary transition-colors text-center leading-tight">
                      {sub.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CategoryHeader;
