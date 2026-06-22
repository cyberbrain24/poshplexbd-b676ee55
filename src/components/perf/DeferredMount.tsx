import { useEffect, useState, ReactNode } from "react";

interface DeferredMountProps {
  children: ReactNode;
  /** Delay after idle, in ms. Default 0. */
  delay?: number;
}

/**
 * Mounts children after the browser is idle (requestIdleCallback) or after a
 * short timeout fallback. Use for non-critical trackers and floating widgets
 * so they don't block LCP/TBT.
 */
const DeferredMount = ({ children, delay = 0 }: DeferredMountProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      if (delay > 0) {
        const t = setTimeout(() => !cancelled && setReady(true), delay);
        return () => clearTimeout(t);
      }
      setReady(true);
    };

    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(start, { timeout: 2000 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = setTimeout(start, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [delay]);

  return ready ? <>{children}</> : null;
};

export default DeferredMount;
