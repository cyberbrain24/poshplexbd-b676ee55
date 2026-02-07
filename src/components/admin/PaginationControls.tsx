/**
 * Pagination Controls Component
 * Reusable pagination UI for server-side paginated data
 */

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UsePaginationResult } from "@/utils/performance";

interface PaginationControlsProps {
  pagination: UsePaginationResult;
  className?: string;
  showPageSize?: boolean;
  pageSizeOptions?: number[];
}

const PaginationControls = memo(function PaginationControls({
  pagination,
  className,
  showPageSize = true,
  pageSizeOptions = [25, 50, 100],
}: PaginationControlsProps) {
  const {
    page,
    pageSize,
    totalPages,
    hasNextPage,
    hasPrevPage,
    range,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
  } = pagination;

  if (pagination.totalCount === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between gap-4 py-4", className)}>
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {range.from}-{range.to} of {pagination.totalCount}
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1); // Reset to first page when changing page size
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(1)}
            disabled={!hasPrevPage}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={prevPage}
            disabled={!hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {/* Page indicator */}
          <span className="flex items-center px-3 text-sm">
            Page {page} of {totalPages || 1}
          </span>

          {/* Next page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={nextPage}
            disabled={!hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPage(totalPages)}
            disabled={!hasNextPage}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default PaginationControls;
