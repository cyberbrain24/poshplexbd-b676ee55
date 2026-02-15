import { useState, useRef, useEffect, useMemo } from "react";
import ImageZoom from "./ImageZoom";
import { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";

interface VariantSelection {
  colorId?: string | null;
  materialId?: string | null;
  sizeId?: string | null;
}

interface ProductImageGalleryProps {
  product?: Product | null;
  isLoading?: boolean;
  selectedColorId?: string | null;
  selectedVariant?: VariantSelection | null;
}

const ProductImageGallery = ({ product, isLoading, selectedColorId, selectedVariant }: ProductImageGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Filter images based on selected variant attributes (color, material, size)
  const productImages = useMemo(() => {
    if (!product?.images || product.images.length === 0) return ['/placeholder.svg'];
    
    const sorted = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
    
    // Determine active filters from either the new selectedVariant or legacy selectedColorId
    const activeColorId = selectedVariant?.colorId ?? selectedColorId;
    const activeMaterialId = selectedVariant?.materialId;
    const activeSizeId = selectedVariant?.sizeId;
    
    const hasActiveFilter = activeColorId || activeMaterialId || activeSizeId;
    
    if (hasActiveFilter) {
      const filtered = sorted.filter(img => {
        // Image has no variant assignment → always show (generic/main image)
        const isGeneric = !img.color_id && !img.material_id && !img.size_id;
        if (isGeneric) return true;
        
        // Image matches if its assigned attribute matches the selected one
        if (img.color_id && activeColorId && img.color_id === activeColorId) return true;
        if (img.material_id && activeMaterialId && img.material_id === activeMaterialId) return true;
        if (img.size_id && activeSizeId && img.size_id === activeSizeId) return true;
        
        return false;
      });
      if (filtered.length > 0) return filtered.map(img => img.image_url);
    }
    
    return sorted.map(img => img.image_url);
  }, [product?.images, selectedColorId, selectedVariant]);

  // Reset image index when variant selection changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedColorId, selectedVariant]);

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
            className="w-full aspect-square overflow-hidden cursor-pointer group touch-pan-y"
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
          <div className="flex justify-center mt-4 gap-2">
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