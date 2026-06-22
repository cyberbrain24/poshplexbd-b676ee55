import { useEffect, useRef, useState, ReactNode } from "react";

interface LazyOnVisibleProps {
  children: ReactNode;
  minHeight: number;
  rootMargin?: string;
  className?: string;
}

/**
 * Renders a reserved-height placeholder until the wrapper scrolls near the
 * viewport, then mounts children. Prevents CLS via required minHeight.
 */
const LazyOnVisible = ({
  children,
  minHeight,
  rootMargin = "300px",
  className,
}: LazyOnVisibleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? undefined : { minHeight }}
    >
      {visible ? children : null}
    </div>
  );
};

export default LazyOnVisible;
