import { useState, useRef, useEffect } from "react";
import { User, Users, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { usePublicMembershipTypes, usePublicMembers } from "@/hooks/usePublicMembers";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const Membership = () => {
  const [activeType, setActiveType] = useState<string | null>(null);
  const { data: membershipTypes = [], isLoading: typesLoading } = usePublicMembershipTypes();
  const { data: members = [], isLoading: membersLoading } = usePublicMembers(activeType ?? undefined);

  const activeTypeName = activeType
    ? membershipTypes.find((t) => t.id === activeType)?.name
    : null;

  // Slider state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [needsSlider, setNeedsSlider] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    const overflows = el.scrollWidth > el.clientWidth + 2;
    setNeedsSlider(overflows);
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [membershipTypes]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground uppercase mb-2">
            Our Members
          </h1>
          <p className="text-sm text-muted-foreground tracking-wider uppercase">
            Meet the community
          </p>
        </div>

        {/* Membership Type Grid / Slider */}
        {typesLoading ? (
          <div className="flex justify-center gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-36 shrink-0 rounded-xl" />
            ))}
          </div>
        ) : membershipTypes.length > 0 ? (
          <div className="relative mb-10">
            {/* Left arrow */}
            {needsSlider && canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors -ml-1"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
            )}

            <div
              ref={scrollRef}
              onScroll={checkOverflow}
              className={cn(
                "flex gap-3 sm:gap-4",
                needsSlider
                  ? "overflow-x-auto scrollbar-hide px-6"
                  : "flex-wrap justify-center"
              )}
              style={needsSlider ? { scrollbarWidth: "none", msOverflowStyle: "none" } : undefined}
            >
              {membershipTypes.map((type) => {
                const isActive = activeType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(isActive ? null : type.id)}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-2 p-5 sm:p-6 rounded-xl border-2 transition-all duration-200 text-center group shrink-0",
                      needsSlider ? "w-36 sm:w-44" : "w-36 sm:w-44",
                      isActive
                        ? "border-foreground bg-foreground text-background shadow-lg scale-[1.02]"
                        : "border-border bg-card text-foreground hover:border-foreground/50 hover:shadow-md"
                    )}
                  >
                    <Users
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 transition-colors",
                        isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                      )}
                      strokeWidth={1.5}
                    />
                    <span className="text-xs sm:text-sm font-bold tracking-wider uppercase">
                      {type.name}
                    </span>
                    {type.description && (
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs leading-tight line-clamp-2",
                          isActive ? "text-background/70" : "text-muted-foreground"
                        )}
                      >
                        {type.description}
                      </span>
                    )}
                    {isActive && (
                      <ChevronDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 text-foreground bg-foreground rounded-full p-0.5 text-background" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right arrow */}
            {needsSlider && canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors -mr-1"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
            )}
          </div>
        ) : null}

        {/* Members Section - only shown when a type is selected */}
        {activeType && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground px-3">
                {activeTypeName} Members
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {membersLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-3">
                    <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : members.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
                {members.map((member) => {
                  const ct = Array.isArray(member.customer_type)
                    ? member.customer_type[0]
                    : member.customer_type;
                  return (
                    <div
                      key={member.id}
                      className="flex flex-col items-center text-center group"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-border bg-muted mb-3 flex items-center justify-center">
                        {member.profile_image_url ? (
                          <img
                            src={member.profile_image_url}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" strokeWidth={1} />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground tracking-wide">
                        {member.name}
                      </p>
                      {ct && (
                        <Badge variant="secondary" className="mt-1 text-[10px] tracking-wider uppercase">
                          {ct.name}
                        </Badge>
                      )}
                      {ct?.show_member_since && member.membership_assigned_at && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Member since {format(new Date(member.membership_assigned_at), "MMM yyyy")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <User className="mx-auto w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
                <p className="text-muted-foreground text-sm tracking-wider uppercase">
                  No members in {activeTypeName} yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Prompt when no type selected */}
        {!activeType && !typesLoading && membershipTypes.length > 0 && (
          <div className="text-center py-16 animate-in fade-in duration-300">
            <Users className="mx-auto w-12 h-12 text-muted-foreground mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm tracking-wider uppercase">
              Select a membership type above to view members
            </p>
          </div>
        )}
      </main>

      <PoshplexFooter />
    </div>
  );
};

export default Membership;
