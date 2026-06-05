import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useProductAttributes } from "@/hooks/useProductAttributes";
import { Link } from "react-router-dom";

interface Props {
  selectedAttributeIds: string[];
  onChange: (ids: string[]) => void;
}

const ProductAttributesPicker = ({ selectedAttributeIds, onChange }: Props) => {
  const { data: attributes = [] } = useProductAttributes();

  const toggle = (id: string, checked: boolean) => {
    onChange(checked
      ? [...selectedAttributeIds, id]
      : selectedAttributeIds.filter((x) => x !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Product Attributes</Label>
        <Link to="/admin/product-attributes" className="text-xs text-muted-foreground hover:text-foreground underline" target="_blank">
          Manage attributes →
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">
        Pick attributes to show as customer-selectable options on the product page.
      </p>
      <div className="border border-border rounded-md p-3 max-h-56 overflow-y-auto space-y-2">
        {attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributes defined yet.</p>
        ) : (
          attributes.filter((a) => a.is_active).map((attr) => {
            const checked = selectedAttributeIds.includes(attr.id);
            return (
              <label
                key={attr.id}
                className="flex items-start gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => toggle(attr.id, !!c)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{attr.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {(attr.values || []).filter(v => v.is_active).map((v) => v.value).join(", ") || "no values"}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
      {selectedAttributeIds.length > 0 && (
        <p className="text-xs text-muted-foreground">{selectedAttributeIds.length} selected</p>
      )}
    </div>
  );
};

export default ProductAttributesPicker;
