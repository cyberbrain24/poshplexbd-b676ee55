import { useState, useMemo, useCallback } from "react";
import { Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { VariantFormData } from "@/types/product";
import type { ProductAttribute } from "@/types/productAttributes";
import { toast } from "sonner";

interface VariantBuilderProps {
  colors: Array<{ id: string; name: string; hex_code: string }>;
  sizes: Array<{ id: string; label: string }>;
  materials: Array<{ id: string; name: string }>;
  existingVariants: VariantFormData[];
  basePrice: number;
  onGenerate: (newVariants: VariantFormData[]) => void;
  attributes?: ProductAttribute[];
  selectedAttributeIds?: string[];
  onToggleAttribute?: (attributeId: string) => void;
}

const VariantBuilder = ({
  colors,
  sizes,
  materials,
  existingVariants,
  basePrice,
  onGenerate,
  attributes = [],
  selectedAttributeIds = [],
  onToggleAttribute,
}: VariantBuilderProps) => {
  // Multi-select state
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

  // attributeId -> selected value ids
  const [selectedValueIdsByAttr, setSelectedValueIdsByAttr] = useState<Record<string, string[]>>({});

  // Bulk apply toggles
  const [useBulkMaterial, setUseBulkMaterial] = useState(false);
  const [bulkMaterialId, setBulkMaterialId] = useState<string | null>(null);
  const [useBulkPurchasePrice, setUseBulkPurchasePrice] = useState(false);
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState(0);
  const [useBulkSellingPrice, setUseBulkSellingPrice] = useState(true);
  const [bulkSellingPrice, setBulkSellingPrice] = useState(basePrice);

  const toggleSelection = useCallback(
    (id: string, selected: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
      setter(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    },
    []
  );

  const toggleValueId = useCallback((attrId: string, valueId: string) => {
    setSelectedValueIdsByAttr((prev) => {
      const cur = prev[attrId] || [];
      const next = cur.includes(valueId) ? cur.filter((v) => v !== valueId) : [...cur, valueId];
      const isAppliedNow = selectedAttributeIds.includes(attrId);
      // Auto-apply attribute when first value is picked; un-apply when all values are removed
      if (next.length > 0 && !isAppliedNow) onToggleAttribute?.(attrId);
      if (next.length === 0 && isAppliedNow) onToggleAttribute?.(attrId);
      return { ...prev, [attrId]: next };
    });
  }, [selectedAttributeIds, onToggleAttribute]);

  // Applied attributes (only those checked in product applied list)
  const appliedAttributes = useMemo(
    () => attributes.filter((a) => selectedAttributeIds.includes(a.id)),
    [attributes, selectedAttributeIds]
  );

  // Preview count (multiplies all selected dimensions)
  const previewCount = useMemo(() => {
    const c = selectedColorIds.length || 1;
    const s = selectedSizeIds.length || 1;
    const m = selectedMaterialIds.length || 1;
    const attrFactor = appliedAttributes.reduce((acc, attr) => {
      const vals = selectedValueIdsByAttr[attr.id] || [];
      return acc * (vals.length || 1);
    }, 1);
    return c * s * m * attrFactor;
  }, [selectedColorIds, selectedSizeIds, selectedMaterialIds, appliedAttributes, selectedValueIdsByAttr]);

  // Generate cartesian product
  const handleGenerate = useCallback(() => {
    const colorsToUse = selectedColorIds.length > 0 ? selectedColorIds : [null];
    const sizesToUse = selectedSizeIds.length > 0 ? selectedSizeIds : [null];
    const materialsToUse = selectedMaterialIds.length > 0
      ? selectedMaterialIds
      : useBulkMaterial && bulkMaterialId
        ? [bulkMaterialId]
        : [null];

    const attrLists: Array<{ attributeId: string; valueIds: Array<string | null> }> = appliedAttributes.map((a) => {
      const vals = selectedValueIdsByAttr[a.id] || [];
      return { attributeId: a.id, valueIds: vals.length > 0 ? vals : [null] };
    });

    const keyFor = (
      colorId: string | null,
      sizeId: string | null,
      materialId: string | null,
      attrPicks: Record<string, string | null>
    ) => {
      const attrPart = appliedAttributes
        .map((a) => `${a.id}:${attrPicks[a.id] || ""}`)
        .join("|");
      return `${colorId || ""}|${sizeId || ""}|${materialId || ""}|${attrPart}`;
    };

    const existingKeys = new Set(
      existingVariants.map((v) =>
        keyFor(v.color_id, v.size_id, v.material_id, v.attribute_values || {})
      )
    );

    const newVariants: VariantFormData[] = [];

    const walkAttrs = (idx: number, acc: Record<string, string | null>, cb: (picks: Record<string, string | null>) => void) => {
      if (idx >= attrLists.length) {
        cb(acc);
        return;
      }
      const { attributeId, valueIds } = attrLists[idx];
      for (const v of valueIds) {
        walkAttrs(idx + 1, { ...acc, [attributeId]: v }, cb);
      }
    };

    for (const colorId of colorsToUse) {
      for (const sizeId of sizesToUse) {
        for (const materialId of materialsToUse) {
          walkAttrs(0, {}, (attrPicks) => {
            const key = keyFor(colorId, sizeId, materialId, attrPicks);
            if (existingKeys.has(key)) return;
            newVariants.push({
              color_id: colorId,
              size_id: sizeId,
              material_id: useBulkMaterial && bulkMaterialId ? bulkMaterialId : materialId,
              sku: "",
              purchase_price: useBulkPurchasePrice ? bulkPurchasePrice : 0,
              selling_price: useBulkSellingPrice ? bulkSellingPrice : basePrice,
              is_active: true,
              image_url: null,
              attribute_values: { ...attrPicks },
            });
          });
        }
      }
    }

    if (newVariants.length === 0) {
      toast.info("All combinations already exist — nothing new to add");
      return;
    }

    onGenerate(newVariants);
    toast.success(`Generated ${newVariants.length} new variant(s)`);
  }, [
    selectedColorIds, selectedSizeIds, selectedMaterialIds,
    useBulkMaterial, bulkMaterialId, useBulkPurchasePrice,
    bulkPurchasePrice, useBulkSellingPrice, bulkSellingPrice,
    basePrice, existingVariants, onGenerate, appliedAttributes, selectedValueIdsByAttr,
  ]);


  const noSelection =
    selectedColorIds.length === 0 &&
    selectedSizeIds.length === 0 &&
    
    selectedMaterialIds.length === 0 &&
    appliedAttributes.every((a) => (selectedValueIdsByAttr[a.id] || []).length === 0);

  return (
    <div className="border border-border rounded-lg p-4 space-y-5 bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-sm">Variant Builder</h4>
          <p className="text-xs text-muted-foreground">
            Select options to auto-generate combinations
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {previewCount} combination{previewCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Multi-select: Colors */}
      <div className="space-y-2">
        <Label className="text-xs">Colors</Label>
        <div className="flex flex-wrap gap-1.5">
          {colors.map((c) => {
            const selected = selectedColorIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleSelection(c.id, selectedColorIds, setSelectedColorIds)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  selected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/50"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: c.hex_code }}
                />
                {c.name}
                {selected && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multi-select: Sizes */}
      <div className="space-y-2">
        <Label className="text-xs">Sizes</Label>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((s) => {
            const selected = selectedSizeIds.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSelection(s.id, selectedSizeIds, setSelectedSizeIds)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  selected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/50"
                }`}
              >
                {s.label}
                {selected && " ✕"}
              </button>
            );
          })}
        </div>
      </div>



      {/* Multi-select: Materials */}
      <div className="space-y-2">
        <Label className="text-xs">Materials</Label>
        <div className="flex flex-wrap gap-1.5">
          {materials.map((m) => {
            const selected = selectedMaterialIds.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleSelection(m.id, selectedMaterialIds, setSelectedMaterialIds)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  selected
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground/50"
                }`}
              >
                {m.name}
                {selected && " ✕"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Attributes (global) — chip-style multi-select, matches Materials/Sizes */}
      {attributes.length > 0 && (
        <div className="space-y-3 border-t border-border pt-4">
          <Label className="text-xs">Product Attributes</Label>
          <div className="space-y-2.5">
            {attributes.map((attr) => {
              const pickedVals = selectedValueIdsByAttr[attr.id] || [];
              return (
                <div key={attr.id} className="space-y-1.5">
                  <div className="text-xs text-muted-foreground">{attr.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(attr.values || []).map((v) => {
                      const selected = pickedVals.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => toggleValueId(attr.id, v.id)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                            selected
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background text-foreground border-border hover:border-foreground/50"
                          }`}
                        >
                          {v.value}
                          {selected && " ✕"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bulk Apply Settings */}
      <div className="border-t border-border pt-4 space-y-3">
        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Bulk Apply Settings
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Bulk Material */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Switch
                id="bulk-material"
                checked={useBulkMaterial}
                onCheckedChange={setUseBulkMaterial}
              />
              <Label htmlFor="bulk-material" className="text-xs">Same Material</Label>
            </div>
            {useBulkMaterial && (
              <Select
                value={bulkMaterialId || "none"}
                onValueChange={(v) => setBulkMaterialId(v === "none" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bulk Selling Price */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Switch
                id="bulk-selling"
                checked={useBulkSellingPrice}
                onCheckedChange={setUseBulkSellingPrice}
              />
              <Label htmlFor="bulk-selling" className="text-xs">Same Price</Label>
            </div>
            {useBulkSellingPrice && (
              <Input
                type="number"
                step="0.01"
                value={bulkSellingPrice}
                onChange={(e) => setBulkSellingPrice(parseFloat(e.target.value) || 0)}
                className="h-8 text-xs"
                placeholder="0.00"
              />
            )}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={noSelection}
        className="w-full"
      >
        <Wand2 className="h-4 w-4 mr-2" />
        Generate {previewCount} Variant{previewCount !== 1 ? "s" : ""}
      </Button>
    </div>
  );
};

export default VariantBuilder;
