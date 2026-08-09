import { useState, useRef, useEffect, useMemo } from "react";
import ImageZoom from "./ImageZoom";
import { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { PRESET_SIZES } from "@/components/ui/responsive-image";
import { cdnImage } from "@/lib/imageUrl";


interface ProductImageGalleryProps {
  product?: Product | null;
  isLoading?: boolean;
  selectedColorId?: string | null;
  selectedVariantImageUrl?: string | null;
}

const ProductImageGallery = ({ product, isLoading, selectedColorId, selectedVariantImageUrl }: ProductImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Build image list: if variant has a specific image, show it first
  const productImages = useMemo(() => {
    const placeholder = [{ url: '/placeholder.svg', medium: null as string | null, large: null as string | null }];
    if (!product?.images || product.images.length === 0) return placeholder;

    const sorted = [...product.images].sort((a, b) => a.sort_order - b.sort_order);

    const toEntry = (img: any) => ({
      url: cdnImage(img.image_url),
      medium: cdnImage(img.medium_url ?? null),
      large: cdnImage(img.large_url ?? null),
    });


    let baseImages: { url: string; medium: string | null; large: string | null }[];
    if (selectedColorId) {
      const filtered = sorted.filter(
        img => !img.color_id || img.color_id === selectedColorId
      );
      baseImages = (filtered.length > 0 ? filtered : sorted).map(toEntry);
    } else {
      baseImages = sorted.map(toEntry);
    }

    // If variant has a specific image, prepend it (avoid duplicate)
    if (selectedVariantImageUrl) {
      const variantUrl = cdnImage(selectedVariantImageUrl);
      const match = baseImages.find(i => i.url === variantUrl);
      const withoutDup = baseImages.filter(i => i.url !== variantUrl);
      return [match || { url: variantUrl, medium: null, large: null }, ...withoutDup];
    }


    return baseImages;
  }, [product?.images, selectedColorId, selectedVariantImageUrl]);

  const zoomImages = useMemo(() => productImages.map(i => i.url), [productImages]);


  // Reset image index when color changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColorId, selectedVariantImageUrl]);

  // YouTube video handling
  const youtubeUrl = product?.youtube_url;
  const youtubeVideoId = youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null;
  const autoplay = product?.youtube_autoplay || false;
  const muted = product?.youtube_mute ?? true;

  function getYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:shorts\/|[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const handleImageClick = (index: number) => {
    setZoomInitialIndex(index);
    setIsZoomOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const difference = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(difference) > minSwipeDistance) {
      if (difference > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="hidden lg:block space-y-4">
          <Skeleton className="w-full aspect-square" />
          <Skeleton className="w-full aspect-square" />
        </div>
        <div className="lg:hidden">
          <Skeleton className="w-full aspect-square" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop: Vertical scrolling gallery (1024px and above) */}
      <div className="hidden lg:block">
        <div className="space-y-4">
          {productImages.map((image, index) => (
            <div 
              key={index} 
              className="w-full aspect-square overflow-hidden cursor-pointer group"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image.large || image.medium || image.url}
                srcSet={[
                  image.medium ? `${image.medium} 300w` : null,
                  image.large ? `${image.large} 450w` : null,
                  image.url ? `${image.url} 1200w` : null,
                ].filter(Boolean).join(", ") || undefined}
                sizes="(min-width: 1024px) 600px, 100vw"
                alt={`Product view ${index + 1}`}
                width={PRESET_SIZES.detail.widths.desktop}
                height={PRESET_SIZES.detail.widths.desktop}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                {...{ fetchpriority: index === 0 ? "high" : "auto" }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

            </div>
          ))}
          
          {/* YouTube Video Section */}
          {youtubeVideoId && (
            <div className="w-full aspect-video overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${autoplay ? 1 : 0}&mute=${muted ? 1 : 0}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Product Video"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tablet/Mobile: Image slider (below 1024px) */}
      <div className="lg:hidden">
        <div className="relative">
          <div 
            className="w-full aspect-[4/3.5] overflow-hidden cursor-pointer group touch-pan-y"
            onClick={() => handleImageClick(currentImageIndex)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={productImages[currentImageIndex].large || productImages[currentImageIndex].medium || productImages[currentImageIndex].url}
              srcSet={[
                productImages[currentImageIndex].medium ? `${productImages[currentImageIndex].medium} 300w` : null,
                productImages[currentImageIndex].large ? `${productImages[currentImageIndex].large} 450w` : null,
                productImages[currentImageIndex].url ? `${productImages[currentImageIndex].url} 1200w` : null,
              ].filter(Boolean).join(", ") || undefined}
              sizes="100vw"
              alt={`Product view ${currentImageIndex + 1}`}
              width={PRESET_SIZES.detail.widths.tablet}
              height={PRESET_SIZES.detail.widths.tablet}
              loading="eager"
              decoding="async"
              {...{ fetchpriority: "high" }}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 select-none"
            />

          </div>
          
          {/* Dots indicator */}
          <div className="flex justify-center mt-2 gap-1.5">
            {productImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 transition-colors ${
                  index === currentImageIndex ? 'bg-foreground' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* YouTube Video Section for Mobile */}
        {youtubeVideoId && (
          <div className="mt-4 w-full aspect-video overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&mute=${muted ? 1 : 0}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Product Video"
            />
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <ImageZoom
        images={zoomImages}
        initialIndex={zoomInitialIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
};

export default ProductImageGallery;