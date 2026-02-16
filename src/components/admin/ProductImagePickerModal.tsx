import { useState, useMemo } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/types/product";

interface ProductImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  images: ProductImage[];
}

const ProductImagePickerModal = ({ isOpen, onClose, onSelect, images }: ProductImagePickerModalProps) => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-background w-full max-w-2xl max-h-[70vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium">Select Variant Image</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No product images available</p>
              <p className="text-sm mt-1">Upload product images first in the Media tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedUrl(img.image_url)}
                  className={`aspect-square overflow-hidden border-2 transition-all ${
                    selectedUrl === img.image_url
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || "Product image"}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedUrl ? "1 image selected" : `${images.length} images available`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!selectedUrl}>
              Select Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImagePickerModal;
