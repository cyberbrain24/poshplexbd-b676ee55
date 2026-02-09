import { useState } from "react";
import ImageLightbox from "@/components/ui/image-lightbox";

interface ReviewImagesProps {
  images: string[];
  size?: "sm" | "md";
}

const ReviewImages = ({ images, size = "sm" }: ReviewImagesProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const sizeClasses = size === "sm" ? "w-12 h-12" : "w-16 h-16";

  return (
    <>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {images.map((url, index) => (
          <button
            key={index}
            onClick={() => {
              setLightboxIndex(index);
              setLightboxOpen(true);
            }}
            className={`${sizeClasses} rounded overflow-hidden border border-border hover:border-foreground/50 transition-colors`}
          >
            <img
              src={url}
              alt={`Review image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default ReviewImages;
