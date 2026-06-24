import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="h-7 w-full bg-foreground/90" aria-hidden="true" />
    <div className="h-14 md:h-16 w-full border-b border-border flex items-center justify-between px-4">
      <Skeleton className="h-6 w-6 md:hidden" />
      <Skeleton className="h-6 w-24 md:w-32" />
      <Skeleton className="h-6 w-6" />
    </div>
    <main className="pt-1">
      <section className="w-full px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image */}
          <div>
            <Skeleton className="w-full aspect-[4/3.5] lg:aspect-square" />
          </div>
          {/* Info */}
          <div className="lg:pl-12 mt-3 lg:mt-8 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
              <Skeleton className="h-10 w-12" />
            </div>
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default ProductDetailSkeleton;
