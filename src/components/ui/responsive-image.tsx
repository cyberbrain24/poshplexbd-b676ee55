import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ImagePreset = "grid" | "detail" | "zoom";

interface ResponsiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "sizes"> {
  src: string;
  /** ~150px WebP variant. */
  thumbUrl?: string | null;
  /** ~300px WebP variant. */
  mediumUrl?: string | null;
  /** ~450px WebP variant. */
  largeUrl?: string | null;
  alt: string;
  fallback?: string;
  preset?: ImagePreset;
  priority?: boolean;
}

/**
 * Responsive breakpoint dimensions per preset (w × h in CSS px).
 *
 * grid   → Desktop 400, Tablet 300, Mobile 200
 * detail → Desktop 800, Tablet 600, Mobile 400
 * zoom   → Desktop 1200, Tablet 900, Mobile 600
 */
const PRESET_SIZES: Record<ImagePreset, { sizes: string; widths: { desktop: number; tablet: number; mobile: number } }> = {
  grid: {
    sizes: "(min-width: 768px) 450px, 300px",
    widths: { desktop: 450, tablet: 450, mobile: 300 },
  },
  detail: {
    sizes: "(min-width: 1024px) 800px, (min-width: 768px) 600px, 400px",
    widths: { desktop: 800, tablet: 600, mobile: 400 },
  },
  zoom: {
    sizes: "(min-width: 1024px) 1200px, (min-width: 768px) 900px, 600px",
    widths: { desktop: 1200, tablet: 900, mobile: 600 },
  },
};

/**
 * ResponsiveImage — single-source image component with:
 * • Device-aware CSS sizing via `sizes` attribute
 * • Lazy loading with IntersectionObserver (unless priority)
 * • Smooth fade-in on load
 * • Graceful fallback on error
 * • Clean background placeholder (no CLS)
 */
const ResponsiveImage = ({
  src,
  thumbUrl,
  mediumUrl,
  alt,
  fallback = "/placeholder.svg",
  preset = "grid",
  priority = false,
  className,
  style,
  ...props
}: ResponsiveImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pick the smallest acceptable variant for this preset. Falls through to the
  // original `src` whenever the variant URL is missing (e.g. legacy uploads).
  const pickedSrc = (() => {
    if (preset === "grid") return thumbUrl || mediumUrl || src;
    if (preset === "detail") return mediumUrl || src;
    return src; // zoom — always full resolution
  })();

  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [pickedSrc]);

  // Lazy-load via IntersectionObserver
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, isInView]);

  const config = PRESET_SIZES[preset];
  const imageSrc = hasError ? fallback : pickedSrc;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden bg-muted", className)}
      style={{ aspectRatio: "1 / 1", ...style }}
    >
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          sizes={config.sizes}
          width={config.widths.desktop}
          height={config.widths.desktop}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
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

export { ResponsiveImage, PRESET_SIZES };
export type { ImagePreset };
