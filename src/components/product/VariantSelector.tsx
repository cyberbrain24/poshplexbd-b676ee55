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

  const uniqueColors = useMemo(() => {
    const m = new Map<string, Color>();
    variants.forEach((v) => { if (v.color && v.is_active) m.set(v.color.id, v.color); });
    return Array.from(m.values());
  }, [variants]);

  const uniqueSizes = useMemo(() => {
    const m = new Map<string, Size>();
    variants.forEach((v) => { if (v.size && v.is_active) m.set(v.size.id, v.size); });
    return Array.from(m.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [variants]);

  const matches = (v: ProductVariant, axis: "color" | "size", id: string) => {
    if (!v.is_active) return false;
    if (axis !== "color" && selectedColor && v.color?.id !== selectedColor) return false;
    if (axis !== "size" && selectedSize && v.size?.id !== selectedSize) return false;
    if (axis === "color") return v.color?.id === id;
    return v.size?.id === id;
  };

  useEffect(() => {
    if (uniqueColors.length === 1 && !selectedColor) setSelectedColor(uniqueColors[0].id);
  }, [uniqueColors, selectedColor]);
  useEffect(() => {
    if (uniqueSizes.length === 1 && !selectedSize) setSelectedSize(uniqueSizes[0].id);
  }, [uniqueSizes, selectedSize]);

  useEffect(() => {
    const needColor = uniqueColors.length > 0;
    const needSize = uniqueSizes.length > 0;
    if (needColor && !selectedColor) return onVariantChange(null);
    if (needSize && !selectedSize) return onVariantChange(null);
    const match = variants.find((v) =>
      v.is_active &&
      (!needColor || v.color?.id === selectedColor) &&
      (!needSize || v.size?.id === selectedSize)
    );
    onVariantChange(match || null);
  }, [selectedColor, selectedSize, variants, uniqueColors.length, uniqueSizes.length, onVariantChange]);

  if (variants.length === 0) return null;

  return (
    <div className="space-y-4 lg:space-y-0">
      <div className="flex flex-col lg:flex-row lg:gap-6 lg:flex-wrap">
        {uniqueColors.length > 0 && (
          <div className="flex items-center justify-center gap-3 lg:block lg:space-y-1.5">
            <div className="hidden lg:flex items-center shrink-0">
              <span className="text-sm font-light text-foreground">Color</span>
            </div>
            <div className="flex flex-wrap gap-3 lg:gap-2 justify-center lg:justify-start">
              {uniqueColors.map((color) => {
                const available = variants.some((v) => matches(v, "color", color.id));
                const isSelected = selectedColor === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(isSelected ? null : color.id)}
                    disabled={!available && selectedSize !== null}
                    className={cn(
                      "w-10 h-10 lg:w-8 lg:h-8 rounded-full border-2 transition-all relative",
                      isSelected ? "border-foreground ring-2 ring-offset-2 ring-foreground" : "border-border hover:border-foreground/50",
                      !available && selectedSize !== null && "opacity-30 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: color.hex_code }}
                    title={color.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {uniqueSizes.length > 0 && (
          <div className="flex items-center justify-center gap-3 lg:block lg:space-y-1.5 mt-4 lg:mt-0">
            <div className="hidden lg:flex items-center shrink-0">
              <span className="text-sm font-light text-foreground">Size</span>
            </div>
            <div className="flex flex-wrap gap-3 lg:gap-2 justify-center lg:justify-start">
              {uniqueSizes.map((size) => {
                const available = variants.some((v) => matches(v, "size", size.id));
                const isSelected = selectedSize === size.id;
                return (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(isSelected ? null : size.id)}
                    disabled={!available && selectedColor !== null}
                    className={cn(
                      "min-w-14 h-10 lg:min-w-12 lg:h-8 px-4 lg:px-3 border text-sm font-light transition-all",
                      isSelected ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground text-foreground",
                      !available && selectedColor !== null && "opacity-30 cursor-not-allowed line-through"
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
    </div>
  );
};

export default VariantSelector;
