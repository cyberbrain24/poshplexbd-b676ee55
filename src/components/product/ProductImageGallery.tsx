import { useState, useRef, useEffect, useMemo } from "react";
import ImageZoom from "./ImageZoom";
import { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";

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
    if (!product?.images || product.images.length === 0) return ['/placeholder.svg'];
    
    const sorted = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
    
    let baseImages: string[];
    if (selectedColorId) {
      const filtered = sorted.filter(
        img => !img.color_id || img.color_id === selectedColorId
      );
      baseImages = filtered.length > 0 ? filtered.map(img => img.image_url) : sorted.map(img => img.image_url);
    } else {
      baseImages = sorted.map(img => img.image_url);
    }
    
    // If variant has a specific image, prepend it (avoid duplicate)
    if (selectedVariantImageUrl) {
      const withoutDup = baseImages.filter(url => url !== selectedVariantImageUrl);
      return [selectedVariantImageUrl, ...withoutDup];
    }
    
    return baseImages;
  }, [product?.images, selectedColorId, selectedVariantImageUrl]);

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
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
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
                src={image}
                alt={`Product view ${index + 1}`}
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
              src={productImages[currentImageIndex]}
              alt={`Product view ${currentImageIndex + 1}`}
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
        images={productImages}
        initialIndex={zoomInitialIndex}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
};

export default ProductImageGallery;