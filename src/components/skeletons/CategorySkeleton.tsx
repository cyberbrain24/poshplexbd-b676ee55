import { Skeleton } from "@/components/ui/skeleton";

const CategorySkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="h-7 w-full bg-foreground/90" aria-hidden="true" />
    <div className="h-14 md:h-16 w-full border-b border-border flex items-center justify-between px-4">
      <Skeleton className="h-6 w-6 md:hidden" />
      <Skeleton className="h-6 w-24 md:w-32" />
      <Skeleton className="h-6 w-6" />
    </div>
    {/* Category title */}
    <div className="px-6 mt-6 mb-4">
      <Skeleton className="h-6 w-40" />
    </div>
    {/* Filter/sort bar */}
    <div className="px-6 mb-6 flex justify-between">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
    {/* Grid */}
    <div className="px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  </div>
);

export default CategorySkeleton;
