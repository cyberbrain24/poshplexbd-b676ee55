import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CategoryBrowser = () => {
  const { data: categories = [], isLoading } = useCategories();

  const mainCategories = categories.filter((c) => !c.parent_id);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeId && mainCategories.length > 0) {
      setActiveId(mainCategories[0].id);
    }
  }, [mainCategories, activeId]);

  const subcategories = categories.filter((c) => c.parent_id === activeId);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(`cat-card-${id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PoshplexHeader />
        <main className="flex-1 px-4 pt-6 pb-20 space-y-6">
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="shrink-0 w-36 h-[88px] rounded-[14px]" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PoshplexHeader />
      <main className="flex-1 px-4 pt-6 pb-20">
        {/* Main Category Slider */}
        <section className="mb-6">
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3"
          >
            {mainCategories.map((cat) => {
              const isActive = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  id={`cat-card-${cat.id}`}
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    "relative shrink-0 snap-center rounded-2xl overflow-hidden transition-all duration-200",
                    "w-24 h-24",
                    isActive
                      ? "scale-105 shadow-lg ring-2 ring-foreground/20"
                      : "opacity-90 scale-100"
                  )}
                >
                {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      width={100}
                      height={100}
                      loading="eager"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )}
                  <div className="absolute inset-0 bg-black/50" />
                  <span className="relative z-10 flex items-center justify-center h-full text-white text-[10px] font-semibold uppercase tracking-wider px-2 text-center">
                    {cat.name}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-white rounded-full" />
                  )}
                </button>
              );
            })}
            <div className="shrink-0 w-4" aria-hidden />
          </div>

          {mainCategories.length > 3 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {mainCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "h-1 rounded-full transition-all duration-200",
                    cat.id === activeId ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </section>

        {/* Subcategory Grid */}
        <section>
          {subcategories.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {subcategories.map((sub) => {
                const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={sub.id}
                    to={`/category/${slug}`}
                    className="relative aspect-square rounded-xl overflow-hidden group"
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
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-12">
              No subcategories found
            </p>
          )}
        </section>
      </main>
      <PoshplexFooter />
    </div>
  );
};

export default CategoryBrowser;
