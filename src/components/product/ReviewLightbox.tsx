import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ReviewLightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

const ReviewLightbox = ({ images, index, onClose, onIndexChange }: ReviewLightboxProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < images.length - 1) onIndexChange(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndexChange(index - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [index, images.length, onClose, onIndexChange]);

  if (!images.length) return null;
  const src = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm animate-fade-in flex items-center justify-center"
      onClick={onClose}
    >
      {/* Highlighted close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 h-11 w-11 rounded-full bg-white text-black shadow-lg flex items-center justify-center hover:scale-110 hover:bg-white transition-transform ring-2 ring-white/40"
      >
        <X className="h-6 w-6" strokeWidth={2.5} />
      </button>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(index - 1); }}
              aria-label="Previous"
              className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {index < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onIndexChange(index + 1); }}
              aria-label="Next"
              className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/90 text-black flex items-center justify-center hover:bg-white"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-xs font-light tracking-widest">
            {index + 1} / {images.length}
          </div>
        </>
      )}

      <img
        src={src}
        alt="Review"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[94vw] object-contain animate-scale-in cursor-default"
      />
    </div>
  );
};

export default ReviewLightbox;
