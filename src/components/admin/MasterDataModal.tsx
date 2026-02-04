import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useMasterData";
import { Category } from "@/types/product";

interface MasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  type: "color" | "size" | "material" | "size-guide" | "care-instruction" | "category" | "brand";
  initialData?: any;
}

const MasterDataModal = ({ isOpen, onClose, onSave, title, type, initialData }: MasterDataModalProps) => {
  const [formData, setFormData] = useState<any>({});
  const { data: categories = [] } = useCategories();
  
  // Get only parent categories (categories with no parent_id)
  const parentCategories = categories.filter((c: Category) => !c.parent_id);
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // Reset form based on type
      switch (type) {
        case "color":
          setFormData({ name: "", hex_code: "#000000" });
          break;
        case "size":
          setFormData({ label: "", fit_type: "", sort_order: 0 });
          break;
        case "material":
          setFormData({ name: "", gsm: "", season: "" });
          break;
        case "size-guide":
        case "care-instruction":
          setFormData({ name: "", content: "" });
          break;
        case "category":
          setFormData({ name: "", parent_id: null });
          break;
        case "brand":
          setFormData({ name: "" });
          break;
      }
    }
  }, [initialData, type, isOpen]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  const renderFields = () => {
    switch (type) {
      case "color":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Color Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hex_code">HEX Code *</Label>
              <div className="flex gap-2">
                <Input
                  id="hex_code"
                  value={formData.hex_code || "#000000"}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  placeholder="#FFD700"
                />
                <input
                  type="color"
                  value={formData.hex_code || "#000000"}
                  onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                  className="w-12 h-10 p-1 border border-border cursor-pointer"
                />
              </div>
            </div>
          </>
        );

      case "size":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="label">Size Label *</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., M, L, XL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fit_type">Fit Type</Label>
              <Input
                id="fit_type"
                value={formData.fit_type || ""}
                onChange={(e) => setFormData({ ...formData, fit_type: e.target.value })}
                placeholder="e.g., Regular, Slim, Relaxed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order || 0}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </>
        );

      case "material":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sterling Silver"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gsm">GSM (optional)</Label>
              <Input
                id="gsm"
                value={formData.gsm || ""}
                onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
                placeholder="e.g., 180"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season (optional)</Label>
              <Input
                id="season"
                value={formData.season || ""}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                placeholder="e.g., All Season, Winter"
              />
            </div>
          </>
        );

      case "size-guide":
      case "care-instruction":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={type === "size-guide" ? "e.g., Earrings Size Guide" : "e.g., Jewelry Care"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={formData.content || ""}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder={type === "size-guide" ? "Size measurements and details..." : "Care and cleaning instructions..."}
                rows={6}
              />
            </div>
          </>
        );

      case "category":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Earrings, Necklaces"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent Category (optional)</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Main Category)</SelectItem>
                  {parentCategories
                    .filter((c: Category) => c.id !== initialData?.id) // Prevent self-parenting
                    .map((category: Category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Main categories appear in the header navigation. Subcategories appear in dropdowns.
              </p>
            </div>
          </>
        );

      case "brand":
        return (
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Poshplex"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isValid = () => {
    switch (type) {
      case "color":
        return formData.name && formData.hex_code;
      case "size":
        return formData.label;
      case "material":
        return formData.name;
      case "size-guide":
      case "care-instruction":
        return formData.name && formData.content;
      case "category":
      case "brand":
        return formData.name;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="w-full max-w-md bg-background p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {renderFields()}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid()}>
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MasterDataModal;
