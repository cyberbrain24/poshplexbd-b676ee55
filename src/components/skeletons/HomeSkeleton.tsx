import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level skeleton for the Home page. Mirrors the real layout's
 * outer dimensions to prevent CLS while the Index chunk loads.
 */
const HomeSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Announcement bar */}
    <div className="h-7 w-full bg-foreground/90" aria-hidden="true" />
    {/* Header */}
    <div className="h-14 md:h-16 w-full border-b border-border flex items-center justify-between px-4">
      <Skeleton className="h-6 w-6 md:hidden" />
      <Skeleton className="h-6 w-24 md:w-32" />
      <Skeleton className="h-6 w-6" />
    </div>
    {/* Hero */}
    <div className="w-full aspect-[3/1] md:aspect-[4/1] bg-muted animate-pulse" aria-hidden="true" />
    {/* Category strip */}
    <div className="px-4 md:px-8 mt-6 flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full" />
      ))}
    </div>
    {/* Product grid */}
    <div className="px-4 md:px-8 mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  </div>
);

export default HomeSkeleton;
