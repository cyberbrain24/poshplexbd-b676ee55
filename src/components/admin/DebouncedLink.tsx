/**
 * Debounced Sidebar Link Component
 * Prevents rapid navigation clicks from triggering multiple Supabase calls
 */

import { forwardRef, useCallback, useRef, MouseEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate, LinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface DebouncedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: ReactNode;
  className?: string;
  debounceMs?: number;
}

/**
 * A Link component that debounces rapid clicks to prevent
 * multiple simultaneous navigation/data fetches
 */
export const DebouncedLink = forwardRef<HTMLAnchorElement, DebouncedLinkProps>(
  ({ to, children, className, debounceMs = 150, onClick, ...props }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const lastClickRef = useRef<number>(0);
    const isNavigatingRef = useRef(false);

    const handleClick = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();

      // If already on this path, do nothing
      if (location.pathname === to) {
        return;
      }

      const now = Date.now();
      const timeSinceLastClick = now - lastClickRef.current;

      // Debounce rapid clicks
      if (timeSinceLastClick < debounceMs || isNavigatingRef.current) {
        return;
      }

      lastClickRef.current = now;
      isNavigatingRef.current = true;

      // Call original onClick if provided
      onClick?.(e);

      // Navigate
      navigate(to);

      // Reset navigation flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, debounceMs);
    }, [to, location.pathname, navigate, debounceMs, onClick]);

    return (
      <Link
        ref={ref}
        to={to}
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

DebouncedLink.displayName = "DebouncedLink";

/**
 * Hook to create debounced navigation handler
 */
export function useDebouncedNavigate(debounceMs = 150) {
  const navigate = useNavigate();
  const location = useLocation();
  const lastNavRef = useRef<number>(0);
  const isNavigatingRef = useRef(false);

  return useCallback((to: string) => {
    if (location.pathname === to) return;

    const now = Date.now();
    if (now - lastNavRef.current < debounceMs || isNavigatingRef.current) {
      return;
    }

    lastNavRef.current = now;
    isNavigatingRef.current = true;
    navigate(to);

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, debounceMs);
  }, [navigate, location.pathname, debounceMs]);
}
