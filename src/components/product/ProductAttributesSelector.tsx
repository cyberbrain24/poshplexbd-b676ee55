import { useProductAppliedAttributesFull } from "@/hooks/useProductAttributes";
import { cn } from "@/lib/utils";

interface Props {
  productId: string;
  selectedValueIds: Record<string, string>; // attributeId -> valueId
  onChange: (attributeId: string, valueId: string | null) => void;
}

const ProductAttributesSelector = ({ productId, selectedValueIds, onChange }: Props) => {
  const { data: attributes = [] } = useProductAppliedAttributesFull(productId);

  if (attributes.length === 0) return null;

  return (
    <div className="space-y-4">
      {attributes.map((attr) => {
        const selectedId = selectedValueIds[attr.id];
        return (
          <div key={attr.id} className="flex items-center justify-center gap-3 lg:block lg:space-y-1.5">
            <div className="hidden lg:flex items-center shrink-0">
              <span className="text-sm font-light text-foreground">{attr.name}</span>
            </div>
            <div className="flex flex-wrap gap-3 lg:gap-2 justify-center lg:justify-start">
              {(attr.values || []).map((v) => {
                const isSelected = selectedId === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => onChange(attr.id, isSelected ? null : v.id)}
                    className={cn(
                      "min-w-14 h-10 lg:min-w-12 lg:h-8 px-4 lg:px-3 border text-sm font-light transition-all",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground text-foreground"
                    )}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductAttributesSelector;
