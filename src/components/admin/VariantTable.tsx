import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VariantFormData } from "@/types/product";

interface VariantTableProps {
  variants: VariantFormData[];
  colors: Array<{ id: string; name: string }>;
  sizes: Array<{ id: string; label: string }>;
  materials: Array<{ id: string; name: string }>;
  onUpdateField: (index: number, field: keyof VariantFormData, value: any) => void;
  onRemove: (index: number) => void;
}

const VariantRow = memo(({
  variant,
  index,
  colors,
  sizes,
  materials,
  onUpdateField,
  onRemove,
}: {
  variant: VariantFormData;
  index: number;
  colors: Array<{ id: string; name: string }>;
  sizes: Array<{ id: string; label: string }>;
  materials: Array<{ id: string; name: string }>;
  onUpdateField: (field: keyof VariantFormData, value: any) => void;
  onRemove: () => void;
}) => (
  <TableRow>
    <TableCell>
      <Select
        value={variant.color_id || "none"}
        onValueChange={(v) => onUpdateField("color_id", v === "none" ? null : v)}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {colors.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell>
      <Select
        value={variant.size_id || "none"}
        onValueChange={(v) => onUpdateField("size_id", v === "none" ? null : v)}
      >
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {sizes.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell>
      <Select
        value={variant.material_id || "none"}
        onValueChange={(v) => onUpdateField("material_id", v === "none" ? null : v)}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {materials.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </TableCell>
    <TableCell>
      <Input
        type="text"
        value={variant.sku}
        onChange={(e) => onUpdateField("sku", e.target.value)}
        placeholder="Auto"
        className="w-24"
      />
    </TableCell>
    <TableCell>
      <Input
        type="number"
        value={variant.purchase_price}
        onChange={(e) => onUpdateField("purchase_price", Number(e.target.value))}
        className="w-20"
      />
    </TableCell>
    <TableCell>
      <Input
        type="number"
        value={variant.selling_price}
        onChange={(e) => onUpdateField("selling_price", Number(e.target.value))}
        className="w-20"
      />
    </TableCell>
    <TableCell>
      <Switch
        checked={variant.is_active}
        onCheckedChange={(v) => onUpdateField("is_active", v)}
      />
    </TableCell>
    <TableCell>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </TableCell>
  </TableRow>
));

VariantRow.displayName = "VariantRow";

const VariantTable = memo(({
  variants,
  colors,
  sizes,
  materials,
  onUpdateField,
  onRemove,
}: VariantTableProps) => {
  const handleUpdateField = useCallback(
    (index: number) => (field: keyof VariantFormData, value: any) => {
      onUpdateField(index, field, value);
    },
    [onUpdateField]
  );

  const handleRemove = useCallback(
    (index: number) => () => onRemove(index),
    [onRemove]
  );

  if (variants.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No variants added. Click "Add Variant" to create one.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Active</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((variant, index) => (
            <VariantRow
              key={index}
              variant={variant}
              index={index}
              colors={colors}
              sizes={sizes}
              materials={materials}
              onUpdateField={handleUpdateField(index)}
              onRemove={handleRemove(index)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

VariantTable.displayName = "VariantTable";

export { VariantTable };