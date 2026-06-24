import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ProductImageContext = "grid" | "gallery" | "zoom";

const CONTEXT_CONFIG: Record<ProductImageContext, { width: number; sizes: string }> = {
  grid: {
    width: 300,
    sizes: "(min-width: 1024px) 400px, 300px",
  },
  gallery: {
    width: 600,
    sizes: "(min-width: 1024px) 800px, 600px",
  },
  zoom: {
    width: 800,
    sizes: "(min-width: 1024px) 1200px, 800px",
  },
};

interface ProductImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "sizes" | "width" | "height"> {
  src: string;
  alt: string;
  context?: ProductImageContext;
  aspectRatio?: string;
  fallback?: string;
  priority?: boolean;
}

/**
 * Unified product image component for mobile-first responsive rendering.
 *
 * Three contexts with mobile-optimized widths:
 * - grid:    300px (product cards / grids)
 * - gallery: 600px (product detail page)
 * - zoom:    800px (lightbox / modal)
 *
 * Features: lazy loading via IntersectionObserver, fade-in, fallback on error, CLS prevention.
 */
const ProductImage = ({
  src,
  alt,
  context = "grid",
  aspectRatio = "1 / 1",
  fallback = "/placeholder.svg",
  priority = false,
  className,
  style,
  ...props
}: ProductImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset on src change
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  // Lazy-load via IntersectionObserver
  useEffect(() => {
    if (priority || isInView) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isInView]);

  const config = CONTEXT_CONFIG[context];
  const imageSrc = hasError ? fallback : src;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio, ...style }}
    >
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          sizes={config.sizes}
          width={config.width}
          height={config.width}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          {...{ fetchpriority: priority ? "high" : "auto" }}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          {...props}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
};

export { ProductImage, CONTEXT_CONFIG };
export type { ProductImageContext };
