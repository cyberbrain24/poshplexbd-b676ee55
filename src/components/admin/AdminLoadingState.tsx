import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page loading spinner for admin modules
 */
export const AdminLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

/**
 * Table skeleton for list views
 */
export const AdminTableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Search bar skeleton */}
    <Skeleton className="h-10 w-full max-w-md" />

    {/* Table skeleton */}
    <div className="border border-border">
      {/* Table header */}
      <div className="flex gap-4 p-4 border-b border-border bg-muted/30">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 ml-auto" />
      </div>
      
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2 ml-auto">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Dashboard skeleton with stats cards
 */
export const AdminDashboardSkeleton = () => (
  <div className="space-y-8">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>

    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 border border-border">
          <Skeleton className="h-5 w-5 mb-2" />
          <Skeleton className="h-8 w-12 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>

    {/* Quick stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-6 border border-border space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Generic card skeleton for settings/forms
 */
export const AdminCardSkeleton = ({ cards = 3 }: { cards?: number }) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Cards */}
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="p-6 border border-border space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Inline loading indicator for buttons/actions
 */
export const InlineLoader = ({ text = "Loading..." }: { text?: string }) => (
  <span className="inline-flex items-center gap-2 text-muted-foreground">
    <Loader2 className="h-4 w-4 animate-spin" />
    {text}
  </span>
);
