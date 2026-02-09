import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useMasterData";
import { Skeleton } from "@/components/ui/skeleton";

// Different scratch patterns for street culture aesthetic
const scratchPatterns = [
  // Pattern 1: Diagonal scratches
  <svg key="p1" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="10" y1="0" x2="90" y2="100" stroke="black" strokeWidth="0.3" opacity="0.4" />
    <line x1="20" y1="0" x2="100" y2="80" stroke="black" strokeWidth="0.2" opacity="0.3" />
    <line x1="0" y1="20" x2="80" y2="100" stroke="black" strokeWidth="0.4" opacity="0.25" />
    <line x1="30" y1="0" x2="100" y2="70" stroke="black" strokeWidth="0.15" opacity="0.35" />
    <line x1="0" y1="40" x2="60" y2="100" stroke="black" strokeWidth="0.25" opacity="0.3" />
  </svg>,
  // Pattern 2: Cross scratches
  <svg key="p2" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="0" y1="30" x2="100" y2="70" stroke="black" strokeWidth="0.3" opacity="0.35" />
    <line x1="100" y1="20" x2="0" y2="80" stroke="black" strokeWidth="0.25" opacity="0.4" />
    <line x1="20" y1="0" x2="80" y2="100" stroke="black" strokeWidth="0.2" opacity="0.3" />
    <line x1="80" y1="0" x2="20" y2="100" stroke="black" strokeWidth="0.15" opacity="0.25" />
  </svg>,
  // Pattern 3: Horizontal scratches
  <svg key="p3" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="0" y1="25" x2="70" y2="25" stroke="black" strokeWidth="0.4" opacity="0.3" />
    <line x1="30" y1="50" x2="100" y2="50" stroke="black" strokeWidth="0.25" opacity="0.35" />
    <line x1="10" y1="75" x2="90" y2="75" stroke="black" strokeWidth="0.3" opacity="0.25" />
    <line x1="5" y1="60" x2="45" y2="60" stroke="black" strokeWidth="0.2" opacity="0.4" />
    <line x1="55" y1="35" x2="95" y2="35" stroke="black" strokeWidth="0.15" opacity="0.3" />
  </svg>,
  // Pattern 4: Vertical scratches
  <svg key="p4" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="20" y1="0" x2="20" y2="60" stroke="black" strokeWidth="0.35" opacity="0.35" />
    <line x1="50" y1="30" x2="50" y2="100" stroke="black" strokeWidth="0.25" opacity="0.4" />
    <line x1="80" y1="10" x2="80" y2="80" stroke="black" strokeWidth="0.3" opacity="0.3" />
    <line x1="35" y1="20" x2="35" y2="70" stroke="black" strokeWidth="0.2" opacity="0.25" />
    <line x1="65" y1="40" x2="65" y2="95" stroke="black" strokeWidth="0.15" opacity="0.35" />
  </svg>,
  // Pattern 5: Wild scratches
  <svg key="p5" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <path d="M5,20 Q30,10 50,30 T95,25" fill="none" stroke="black" strokeWidth="0.3" opacity="0.35" />
    <path d="M10,70 Q40,60 60,80 T90,75" fill="none" stroke="black" strokeWidth="0.25" opacity="0.3" />
    <line x1="0" y1="50" x2="40" y2="45" stroke="black" strokeWidth="0.2" opacity="0.4" />
    <line x1="60" y1="55" x2="100" y2="50" stroke="black" strokeWidth="0.15" opacity="0.3" />
  </svg>,
  // Pattern 6: Corner scratches
  <svg key="p6" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="0" y1="0" x2="40" y2="40" stroke="black" strokeWidth="0.4" opacity="0.35" />
    <line x1="100" y1="100" x2="60" y2="60" stroke="black" strokeWidth="0.3" opacity="0.3" />
    <line x1="0" y1="100" x2="30" y2="70" stroke="black" strokeWidth="0.25" opacity="0.4" />
    <line x1="100" y1="0" x2="70" y2="30" stroke="black" strokeWidth="0.2" opacity="0.25" />
    <line x1="10" y1="10" x2="50" y2="50" stroke="black" strokeWidth="0.15" opacity="0.3" />
  </svg>,
  // Pattern 7: Sparse diagonal
  <svg key="p7" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="0" y1="15" x2="85" y2="100" stroke="black" strokeWidth="0.5" opacity="0.3" />
    <line x1="15" y1="0" x2="100" y2="85" stroke="black" strokeWidth="0.2" opacity="0.4" />
    <line x1="40" y1="0" x2="100" y2="60" stroke="black" strokeWidth="0.15" opacity="0.25" />
  </svg>,
  // Pattern 8: Dense scratches
  <svg key="p8" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
    <line x1="5" y1="0" x2="95" y2="100" stroke="black" strokeWidth="0.2" opacity="0.3" />
    <line x1="15" y1="0" x2="100" y2="90" stroke="black" strokeWidth="0.15" opacity="0.25" />
    <line x1="0" y1="10" x2="90" y2="100" stroke="black" strokeWidth="0.25" opacity="0.35" />
    <line x1="25" y1="0" x2="100" y2="80" stroke="black" strokeWidth="0.1" opacity="0.4" />
    <line x1="0" y1="25" x2="75" y2="100" stroke="black" strokeWidth="0.3" opacity="0.2" />
    <line x1="35" y1="0" x2="100" y2="65" stroke="black" strokeWidth="0.2" opacity="0.3" />
  </svg>,
];

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

      {/* Section Header - Street style */}
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

      {/* Category Grid with scratch overlays */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 relative z-10">
        {mainCategories.map((category, index) => {
          const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
          const scratchPattern = scratchPatterns[index % scratchPatterns.length];
          
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
                
                {/* Black scratch overlay - unique per category */}
                {scratchPattern}
                
                {/* Grunge edge effect */}
                <div className="absolute inset-0 pointer-events-none opacity-30">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-black/40 via-transparent to-black/30" />
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-black/30 via-transparent to-black/40" />
                  <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-black/40 via-transparent to-black/30" />
                  <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-black/30 via-transparent to-black/40" />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                
                {/* Index number - street style */}
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
