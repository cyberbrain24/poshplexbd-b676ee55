/**
 * Poshplex ERP Performance Utilities
 * Debouncing, memoization, and pagination helpers
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

// ============================================================
// DEBOUNCE HOOK - 300ms default for search inputs
// ============================================================
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Debounced callback for actions
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// ============================================================
// PAGINATION HOOK - Server-side pagination
// ============================================================
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalCount: (count: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export interface UsePaginationResult extends PaginationState, PaginationActions {
  offset: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  range: { from: number; to: number };
}

export function usePagination(
  initialPageSize = 50,
  initialPage = 1
): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);

  const offset = (page - 1) * pageSize;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1);
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) setPage((p) => p - 1);
  }, [hasPrevPage]);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  // Calculate range for display (e.g., "1-50 of 1000")
  const range = useMemo(() => ({
    from: totalCount === 0 ? 0 : offset + 1,
    to: Math.min(offset + pageSize, totalCount),
  }), [offset, pageSize, totalCount]);

  return {
    page,
    pageSize,
    totalCount,
    offset,
    totalPages,
    hasNextPage,
    hasPrevPage,
    range,
    setPage,
    setPageSize,
    setTotalCount,
    nextPage,
    prevPage,
    reset,
  };
}

// ============================================================
// OPTIMISTIC UPDATE HELPER
// ============================================================
export function useOptimisticUpdate<T>() {
  const previousDataRef = useRef<T | null>(null);

  const storeSnapshot = useCallback((data: T) => {
    previousDataRef.current = structuredClone(data);
  }, []);

  const getSnapshot = useCallback(() => {
    return previousDataRef.current;
  }, []);

  const clearSnapshot = useCallback(() => {
    previousDataRef.current = null;
  }, []);

  return { storeSnapshot, getSnapshot, clearSnapshot };
}

// ============================================================
// MEMOIZED FILTER/SORT
// ============================================================
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: any[] = []
): T[] {
  return useMemo(() => {
    return items.filter(filterFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);
}

export function useMemoizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  deps: any[] = []
): T[] {
  return useMemo(() => {
    return [...items].sort(sortFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, ...deps]);
}

// ============================================================
// STABLE REFERENCE HOOK
// ============================================================
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
}

// ============================================================
// CACHE-FIRST QUERY WRAPPER CONFIG
// ============================================================
export const QUERY_CONFIG = {
  // Aggressive caching for reference data (colors, sizes, categories)
  referenceData: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  },
  // Standard caching for list views
  listView: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  },
  // Live data for queues and dashboards
  liveData: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 1,
  },
  // Single item detail views
  detailView: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  },
} as const;

// ============================================================
// COLUMN SELECTION HELPERS - For "Slim Query" pattern
// ============================================================
export const SLIM_COLUMNS = {
  // Orders list view - only essential columns
  ordersList: `
    id,
    order_number,
    order_status,
    payment_status,
    total_amount,
    shipping_name,
    shipping_phone,
    created_at,
    customer:customers(id, name, phone)
  `,
  // Products list view
  productsList: `
    id,
    name,
    sku,
    product_type,
    base_price,
    is_active,
    created_at,
    category:categories(id, name),
    images:product_images(id, image_url, is_main)
  `,
  // Inventory list view
  inventoryList: `
    id,
    sku,
    stock,
    available_stock,
    selling_price,
    is_active,
    product:products(id, name),
    color:colors(id, name),
    size:sizes(id, label)
  `,
  // Customers list view
  customersList: `
    id,
    name,
    phone,
    email,
    is_active,
    created_at,
    division:divisions(id, name),
    thana:thanas(id, name)
  `,
} as const;
