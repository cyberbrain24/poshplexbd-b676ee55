import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TransactionCategory } from "@/hooks/useAccounts";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: TransactionCategory | null;
  type: "income" | "expense";
  parentCategories: TransactionCategory[];
}

const CategoryModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  type,
  parentCategories,
}: CategoryModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    parent_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        parent_id: initialData.parent_id || "",
        is_active: initialData.is_active,
      });
    } else {
      setFormData({
        name: "",
        parent_id: "",
        is_active: true,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      type,
      parent_id: formData.parent_id || null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit" : "Add"} {type === "income" ? "Income" : "Expense"} Category
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Category Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Salary, Rent, Utilities"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Parent Category (optional)</Label>
            <Select
              value={formData.parent_id}
              onValueChange={(v) => setFormData({ ...formData, parent_id: v === "none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (Main Category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Main Category)</SelectItem>
                {parentCategories
                  .filter((c) => c.id !== initialData?.id)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.name}>
              {initialData ? "Update" : "Add"} Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
