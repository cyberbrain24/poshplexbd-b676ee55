/**
 * Admin Query Hook
 * Wraps React Query with navigation-aware cancellation and enhanced error handling
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient, QueryKey, UseQueryOptions } from "@tanstack/react-query";

interface UseAdminQueryOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'> {
  queryKey: QueryKey;
  queryFn: (signal: AbortSignal) => Promise<TData>;
  /** Cancel on navigation (default: true) */
  cancelOnNavigate?: boolean;
}

/**
 * Hook that automatically cancels queries when navigating away
 * Useful for preventing stale state and race conditions in admin modules
 */
export function useAdminQuery<TData, TError = Error>({
  queryKey,
  queryFn,
  cancelOnNavigate = true,
  ...options
}: UseAdminQueryOptions<TData, TError>) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousPathRef = useRef(location.pathname);

  // Cancel in-flight requests when navigating away
  useEffect(() => {
    if (cancelOnNavigate && previousPathRef.current !== location.pathname) {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel the query in React Query
      queryClient.cancelQueries({ queryKey });
    }
    previousPathRef.current = location.pathname;
  }, [location.pathname, queryKey, queryClient, cancelOnNavigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return useQuery<TData, TError>({
    queryKey,
    queryFn: async () => {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      try {
        return await queryFn(abortControllerRef.current.signal);
      } catch (error) {
        // Don't throw on abort - just return undefined to prevent error state
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Query cancelled");
        }
        throw error;
      }
    },
    // Retry configuration for network resilience
    retry: (failureCount, error) => {
      // Don't retry cancelled queries
      if (error instanceof Error && error.message === "Query cancelled") {
        return false;
      }
      return failureCount < 2;
    },
    // Keep previous data during refetch for smoother transitions
    placeholderData: (previousData) => previousData,
    ...options,
  });
}

/**
 * Hook to reset admin module state on navigation
 * Call this in admin pages to ensure clean state on route change
 */
export function useAdminNavigationReset(resetFn?: () => void) {
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip reset on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathRef.current = location.pathname;
      return;
    }

    // Reset state when navigating to a new path
    if (previousPathRef.current !== location.pathname) {
      resetFn?.();
      previousPathRef.current = location.pathname;
    }
  }, [location.pathname, resetFn]);
}

/**
 * Hook to handle query loading states with minimum display time
 * Prevents flash of loading states for fast queries
 */
export function useSmoothedLoading(isLoading: boolean, minDisplayTime = 300) {
  const loadingStartRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading && !loadingStartRef.current) {
      loadingStartRef.current = Date.now();
    }

    if (!isLoading && loadingStartRef.current) {
      const elapsed = Date.now() - loadingStartRef.current;
      if (elapsed < minDisplayTime) {
        // Keep showing loading state for minimum time
        timeoutRef.current = setTimeout(() => {
          loadingStartRef.current = null;
        }, minDisplayTime - elapsed);
      } else {
        loadingStartRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDisplayTime]);

  return isLoading || loadingStartRef.current !== null;
}
