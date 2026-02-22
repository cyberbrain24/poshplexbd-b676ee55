/**
 * Virtualized Table Component
 * Uses react-window v2 for efficient rendering of large lists
 * Only renders visible rows, keeping memory usage constant
 */

import React, { memo, CSSProperties, ReactElement } from "react";
import { List, RowComponentProps } from "react-window";
import { cn } from "@/lib/utils";

export interface VirtualizedColumn<T> {
  key: string;
  header: string;
  width: number;
  render: (item: T, index: number) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: VirtualizedColumn<T>[];
  rowHeight?: number;
  maxHeight?: number;
  onRowClick?: (item: T, index: number) => void;
  getRowKey: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

// Define the row props type for react-window v2
interface RowProps<T> {
  items: T[];
  columns: VirtualizedColumn<T>[];
  onRowClick?: (item: T, index: number) => void;
}

// Row component for react-window v2
function VirtualizedRow<T>({
  index,
  style,
  items,
  columns,
  onRowClick,
}: {
  ariaAttributes: { "aria-posinset": number; "aria-setsize": number; role: "listitem" };
  index: number;
  style: CSSProperties;
} & RowProps<T>): ReactElement | null {
  const item = items[index];

  if (!item) return null;

  const handleClick = () => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  };

  return (
    <div
      style={style}
      className={cn(
        "flex items-center border-b border-border hover:bg-muted/50 transition-colors",
        onRowClick && "cursor-pointer"
      )}
      onClick={handleClick}
      role="row"
    >
      {columns.map((col) => (
        <div
          key={col.key}
          style={{ width: col.width, minWidth: col.width }}
          className="px-3 py-2 truncate"
          role="cell"
        >
          {col.render(item, index)}
        </div>
      ))}
    </div>
  );
}

function VirtualizedTableInner<T>({
  data,
  columns,
  rowHeight = 48,
  maxHeight = 600,
  onRowClick,
  getRowKey,
  emptyMessage = "No data available",
  className,
}: VirtualizedTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Calculate visible height based on data length
  const visibleHeight = Math.min(data.length * rowHeight, maxHeight);

  if (data.length === 0) {
    return (
      <div className={cn("border rounded-lg", className)}>
        {/* Header */}
        <div
          className="flex items-center border-b bg-muted/50 font-medium"
          style={{ minWidth: totalWidth }}
          role="row"
        >
          {columns.map((col) => (
            <div
              key={col.key}
              style={{ width: col.width, minWidth: col.width }}
              className="px-3 py-3 text-sm"
              role="columnheader"
            >
              {col.header}
            </div>
          ))}
        </div>
        {/* Empty state */}
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)} role="table">
      {/* Header */}
      <div
        className="flex items-center border-b bg-muted/50 font-medium overflow-x-auto"
        style={{ minWidth: totalWidth }}
        role="row"
      >
        {columns.map((col) => (
          <div
            key={col.key}
            style={{ width: col.width, minWidth: col.width }}
            className="px-3 py-3 text-sm"
            role="columnheader"
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized body using react-window v2 List */}
      {React.createElement(List, {
        rowCount: data.length,
        rowHeight,
        rowComponent: VirtualizedRow as any,
        rowProps: {
          items: data,
          columns,
          onRowClick,
        },
        style: {
          height: visibleHeight,
          minWidth: totalWidth,
          overflowX: "auto",
        },
      } as any)}
    </div>
  );
}

// Export as memoized component
export const VirtualizedTable = memo(VirtualizedTableInner) as <T>(
  props: VirtualizedTableProps<T>
) => React.ReactElement;

export default VirtualizedTable;
