/**
 * Debounced Navigation Hook
 * Prevents rapid navigation clicks from causing multiple simultaneous Supabase calls
 */

import { useCallback, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface UseDebounceNavigationOptions {
  /** Debounce delay in milliseconds (default: 150ms) */
  delay?: number;
  /** Callback when navigation is blocked */
  onBlocked?: (targetPath: string) => void;
}

/**
 * Hook that debounces navigation to prevent rapid sidebar clicks
 * from triggering multiple simultaneous data fetches
 */
export function useDebouncedNavigation(options: UseDebounceNavigationOptions = {}) {
  const { delay = 150, onBlocked } = options;
  const navigate = useNavigate();
  const location = useLocation();
  const lastNavigationRef = useRef<number>(0);
  const pendingNavigationRef = useRef<NodeJS.Timeout | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const debouncedNavigate = useCallback((to: string) => {
    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationRef.current;

    // If already on this path, do nothing
    if (location.pathname === to) {
      return;
    }

    // Clear any pending navigation
    if (pendingNavigationRef.current) {
      clearTimeout(pendingNavigationRef.current);
    }

    // If navigating too quickly, debounce
    if (timeSinceLastNav < delay) {
      onBlocked?.(to);
      setIsNavigating(true);
      
      pendingNavigationRef.current = setTimeout(() => {
        lastNavigationRef.current = Date.now();
        navigate(to);
        setIsNavigating(false);
        pendingNavigationRef.current = null;
      }, delay - timeSinceLastNav);
    } else {
      // Navigate immediately
      lastNavigationRef.current = now;
      navigate(to);
    }
  }, [navigate, location.pathname, delay, onBlocked]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (pendingNavigationRef.current) {
      clearTimeout(pendingNavigationRef.current);
    }
  }, []);

  return {
    navigate: debouncedNavigate,
    isNavigating,
    cleanup,
  };
}

/**
 * Hook to track and prevent duplicate navigation
 */
export function useNavigationGuard() {
  const location = useLocation();
  const lastPathRef = useRef(location.pathname);
  const navigationCountRef = useRef(0);

  const canNavigate = useCallback((targetPath: string): boolean => {
    // Always allow navigation to different paths
    if (targetPath !== lastPathRef.current) {
      lastPathRef.current = targetPath;
      navigationCountRef.current = 0;
      return true;
    }
    
    // Limit repeated navigation to same path
    navigationCountRef.current++;
    return navigationCountRef.current <= 1;
  }, []);

  return { canNavigate };
}
