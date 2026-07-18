import { useState, useMemo, useCallback } from "react";
import { Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { VariantFormData } from "@/types/product";
import { toast } from "sonner";

interface VariantBuilderProps {
  colors: Array<{ id: string; name: string; hex_code: string }>;
  sizes: Array<{ id: string; label: string }>;
  existingVariants: VariantFormData[];
  basePrice: number;
  onGenerate: (newVariants: VariantFormData[]) => void;
}

const VariantBuilder = ({ colors, sizes, existingVariants, basePrice, onGenerate }: VariantBuilderProps) => {
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [useBulkSellingPrice, setUseBulkSellingPrice] = useState(true);
  const [bulkSellingPrice, setBulkSellingPrice] = useState(basePrice);

  const toggleSelection = useCallback((id: string, selected: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }, []);

  const previewCount = useMemo(() => {
    return (selectedColorIds.length || 1) * (selectedSizeIds.length || 1);
  }, [selectedColorIds, selectedSizeIds]);

  const handleGenerate = useCallback(() => {
    const colorsToUse = selectedColorIds.length > 0 ? selectedColorIds : [null];
    const sizesToUse = selectedSizeIds.length > 0 ? selectedSizeIds : [null];
    const keyFor = (colorId: string | null, sizeId: string | null) => `${colorId || ""}|${sizeId || ""}`;
    const existingKeys = new Set(existingVariants.map((v) => keyFor(v.color_id, v.size_id)));
    const newVariants: VariantFormData[] = [];
    for (const colorId of colorsToUse) {
      for (const sizeId of sizesToUse) {
        const key = keyFor(colorId, sizeId);
        if (existingKeys.has(key)) continue;
        newVariants.push({
          color_id: colorId,
          size_id: sizeId,
          sku: "",
          purchase_price: 0,
          selling_price: useBulkSellingPrice ? bulkSellingPrice : basePrice,
          is_active: true,
          image_url: null,
        });
      }
    }
    if (newVariants.length === 0) { toast.info("All combinations already exist"); return; }
    onGenerate(newVariants);
    toast.success(`Generated ${newVariants.length} new variant(s)`);
  }, [selectedColorIds, selectedSizeIds, useBulkSellingPrice, bulkSellingPrice, basePrice, existingVariants, onGenerate]);

  const noSelection = selectedColorIds.length === 0 && selectedSizeIds.length === 0;

  return (
    <div className="border border-border rounded-lg p-4 space-y-5 bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">Variant Builder</h4>
          <p className="text-xs text-muted-foreground">Select options to auto-generate combinations</p>
        </div>
        <Badge variant="secondary" className="text-xs">{previewCount} combination{previewCount !== 1 ? "s" : ""}</Badge>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Colors</Label>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => {
            const selected = selectedColorIds.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggleSelection(c.id, selectedColorIds, setSelectedColorIds)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors ${selected ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:border-foreground/50"}`}>
                <span className="w-3 h-3 rounded-full border border-border shrink-0" style={{ backgroundColor: c.hex_code }} />
                {c.name}
                {selected && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Sizes</Label>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => {
            const selected = selectedSizeIds.includes(s.id);
            return (
              <button key={s.id} type="button" onClick={() => toggleSelection(s.id, selectedSizeIds, setSelectedSizeIds)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${selected ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:border-foreground/50"}`}>
                {s.label}{selected && " ✕"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Switch id="bulk-selling" checked={useBulkSellingPrice} onCheckedChange={setUseBulkSellingPrice} />
            <Label htmlFor="bulk-selling" className="text-xs">Same Price</Label>
          </div>
          {useBulkSellingPrice && (
            <Input type="number" step="0.01" value={bulkSellingPrice}
              onChange={(e) => setBulkSellingPrice(parseFloat(e.target.value) || 0)}
              className="h-8 text-xs" placeholder="0.00" />
          )}
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={noSelection} className="w-full">
        <Wand2 className="h-4 w-4 mr-2" />
        Generate {previewCount} Variant{previewCount !== 1 ? "s" : ""}
      </Button>
    </div>
  );
};

export default VariantBuilder;
