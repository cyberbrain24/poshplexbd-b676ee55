import { useState, useEffect, useMemo } from "react";
import { ProductVariant, Color, Size } from "@/types/product";
import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantChange: (variant: ProductVariant | null) => void;
}

const VariantSelector = ({ variants, onVariantChange }: VariantSelectorProps) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Get unique colors and sizes from variants
  const uniqueColors = useMemo(() => {
    const colorMap = new Map<string, Color>();
    variants.forEach((v) => {
      if (v.color && v.is_active) {
        colorMap.set(v.color.id, v.color);
      }
    });
    return Array.from(colorMap.values());
  }, [variants]);

  const uniqueSizes = useMemo(() => {
    const sizeMap = new Map<string, Size>();
    variants.forEach((v) => {
      if (v.size && v.is_active) {
        sizeMap.set(v.size.id, v.size);
      }
    });
    return Array.from(sizeMap.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [variants]);

  // Get available sizes for selected color - all active variants are in stock
  const availableSizes = useMemo(() => {
    if (!selectedColor) return uniqueSizes;
    return variants
      .filter((v) => v.color?.id === selectedColor && v.is_active)
      .map((v) => v.size)
      .filter((s): s is Size => s !== null);
  }, [selectedColor, variants, uniqueSizes]);

  // Get available colors for selected size - all active variants are in stock
  const availableColors = useMemo(() => {
    if (!selectedSize) return uniqueColors;
    return variants
      .filter((v) => v.size?.id === selectedSize && v.is_active)
      .map((v) => v.color)
      .filter((c): c is Color => c !== null);
  }, [selectedSize, variants, uniqueColors]);

  // Auto-select first color if only one
  useEffect(() => {
    if (uniqueColors.length === 1 && !selectedColor) {
      setSelectedColor(uniqueColors[0].id);
    }
  }, [uniqueColors, selectedColor]);

  // Find matching variant when both color and size are selected
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const matchingVariant = variants.find(
        (v) =>
          v.color?.id === selectedColor &&
          v.size?.id === selectedSize &&
          v.is_active
      );
      onVariantChange(matchingVariant || null);
    } else if (selectedColor && uniqueSizes.length === 0) {
      // Product has color but no sizes
      const matchingVariant = variants.find(
        (v) => v.color?.id === selectedColor && v.is_active
      );
      onVariantChange(matchingVariant || null);
    } else if (selectedSize && uniqueColors.length === 0) {
      // Product has size but no colors
      const matchingVariant = variants.find(
        (v) => v.size?.id === selectedSize && v.is_active
      );
      onVariantChange(matchingVariant || null);
    } else {
      onVariantChange(null);
    }
  }, [selectedColor, selectedSize, variants, uniqueColors.length, uniqueSizes.length, onVariantChange]);

  if (variants.length === 0) return null;

  const isColorAvailable = (colorId: string) => {
    return availableColors.some((c) => c.id === colorId);
  };

  const isSizeAvailable = (sizeId: string) => {
    return availableSizes.some((s) => s.id === sizeId);
  };

  return (
    <div className="space-y-3">
      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div className="flex items-center justify-center gap-3 lg:block lg:space-y-1.5">
          <div className="flex items-center shrink-0 lg:justify-between">
            <span className="text-sm font-light text-foreground">Color</span>
            {selectedColor && (
              <span className="text-sm font-light text-muted-foreground hidden lg:inline ml-auto">
                {uniqueColors.find((c) => c.id === selectedColor)?.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {uniqueColors.map((color) => {
              const isAvailable = isColorAvailable(color.id);
              const isSelected = selectedColor === color.id;
              
              return (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  disabled={!isAvailable && selectedSize !== null}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all relative",
                    isSelected
                      ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                      : "border-border hover:border-foreground/50",
                    !isAvailable && selectedSize !== null && "opacity-30 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: color.hex_code }}
                  title={color.name}
                >
                  {!isAvailable && selectedSize !== null && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-0.5 bg-muted-foreground rotate-45 absolute" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {uniqueSizes.length > 0 && (
        <div className="flex items-center justify-center gap-3 lg:block lg:space-y-1.5">
          <div className="flex items-center shrink-0 lg:justify-between">
            <span className="text-sm font-light text-foreground">Size</span>
            {selectedSize && (
              <span className="text-sm font-light text-muted-foreground hidden lg:inline ml-auto">
                {uniqueSizes.find((s) => s.id === selectedSize)?.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
            {uniqueSizes.map((size) => {
              const isAvailable = isSizeAvailable(size.id);
              const isSelected = selectedSize === size.id;
              
              return (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  disabled={!isAvailable && selectedColor !== null}
                  className={cn(
                    "min-w-12 h-8 px-3 border text-sm font-light transition-all relative",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground text-foreground",
                    !isAvailable && selectedColor !== null && "opacity-30 cursor-not-allowed line-through"
                  )}
                >
                  {size.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;