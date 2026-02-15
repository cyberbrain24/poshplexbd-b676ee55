import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CategoryBrowser = () => {
  const { data: categories = [], isLoading } = useCategories();

  // Main categories (no parent)
  const mainCategories = categories.filter((c) => !c.parent_id);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-select first main category
  useEffect(() => {
    if (!activeId && mainCategories.length > 0) {
      setActiveId(mainCategories[0].id);
    }
  }, [mainCategories, activeId]);

  // Subcategories of active
  const subcategories = categories.filter((c) => c.parent_id === activeId);

  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    setActiveId(id);
    // Scroll active card into view
    const el = document.getElementById(`cat-card-${id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PoshplexHeader />
        <main className="px-4 pt-6 pb-24">
          <div className="flex gap-3 overflow-hidden mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-40 h-24 rounded-[14px] shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-[14px]" />
            ))}
          </div>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />

      <main className="pb-8">
        {/* ── Main Category Slider ── */}
        <section className="pt-6 pb-4">
          <div
            ref={sliderRef}
            className="flex gap-3 overflow-x-auto px-4 scrollbar-hide snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {mainCategories.map((cat) => {
              const isActive = cat.id === activeId;
              return (
                <button
                  id={`cat-card-${cat.id}`}
                  key={cat.id}
                  onClick={() => handleSelect(cat.id)}
                  className={cn(
                    "relative shrink-0 snap-center rounded-[14px] overflow-hidden transition-all duration-200",
                    "w-36 h-[88px]",
                    isActive
                      ? "scale-105 shadow-lg ring-1 ring-foreground/20"
                      : "opacity-90 scale-100"
                  )}
                >
                  {/* Background */}
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-foreground" />
                  )}

                  {/* Overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 transition-opacity duration-200",
                      isActive
                        ? "bg-black/30"
                        : "bg-black/50"
                    )}
                  />

                  {/* Label */}
                  <span className="relative z-10 flex items-center justify-center h-full text-[11px] font-bold tracking-[0.12em] text-white uppercase px-3 text-center leading-tight">
                    {cat.name}
                  </span>

                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white rounded-full" />
                  )}
                </button>
              );
            })}
            {/* Ghost spacer so last card can center */}
            <div className="shrink-0 w-4" aria-hidden />
          </div>

          {/* Scroll dots */}
          {mainCategories.length > 3 && (
            <div className="flex justify-center gap-1 mt-3">
              {mainCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    cat.id === activeId
                      ? "w-4 h-1.5 bg-foreground"
                      : "w-1.5 h-1.5 bg-foreground/25"
                  )}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Subcategory Grid ── */}
        <section className="px-4 pt-2">
          {subcategories.length > 0 ? (
            <div className="grid grid-cols-3 gap-[10px]">
              {subcategories.map((sub) => {
                const slug = sub.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={sub.id}
                    to={`/category/${slug}`}
                    className="group relative aspect-square rounded-[14px] overflow-hidden active:scale-95 transition-transform duration-150"
                  >
                    {sub.image_url ? (
                      <img
                        src={sub.image_url}
                        alt={sub.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-foreground" />
                    )}

                    <div className="absolute inset-0 bg-black/40 group-active:bg-black/50 transition-colors duration-150" />

                    <span className="relative z-10 flex items-center justify-center h-full text-[11px] font-bold tracking-[0.1em] text-white uppercase px-2 text-center leading-tight">
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
