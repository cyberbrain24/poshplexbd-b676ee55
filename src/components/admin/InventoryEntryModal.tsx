import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useAccounts, useTransactionCategories } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InventoryEntry, InventoryItemInput } from "@/services/inventory.service";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entry: { date: string; notes?: string; account_id?: string | null; category_id?: string | null }, items: InventoryItemInput[]) => void;
  type: "in" | "out";
  editEntry?: InventoryEntry | null;
  saving?: boolean;
}

interface LineItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  purchase_price: number;
}

const InventoryEntryModal = ({ open, onClose, onSave, type, editEntry, saving }: Props) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([{ product_id: "", variant_id: "", quantity: 1, purchase_price: 0 }]);

  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories();
  const expenseCategories = categories?.filter((c) => c.type === "expense") || [];

  // Fetch products for dropdown
  const { data: products } = useQuery({
    queryKey: ["products-for-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch variants for selected products
  const selectedProductIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
  const { data: variants } = useQuery({
    queryKey: ["variants-for-inventory", selectedProductIds],
    queryFn: async () => {
      if (!selectedProductIds.length) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("id, product_id, sku, selling_price, purchase_price, color:colors(name), size:sizes(label), material:materials(name)")
        .in("product_id", selectedProductIds)
        .eq("is_active", true)
        .order("sku");
      if (error) throw error;
      return data;
    },
    enabled: selectedProductIds.length > 0,
  });

  // Populate form when editing
  useEffect(() => {
    if (editEntry) {
      setDate(editEntry.date);
      setNotes(editEntry.notes || "");
      setAccountId(editEntry.account_id || "");
      setCategoryId(editEntry.category_id || "");
      if (editEntry.items?.length) {
        setItems(editEntry.items.map((i) => ({
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
        })));
      }
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setAccountId("");
      setCategoryId("");
      setItems([{ product_id: "", variant_id: "", quantity: 1, purchase_price: 0 }]);
    }
  }, [editEntry, open]);

  const addLine = () => setItems([...items, { product_id: "", variant_id: "", quantity: 1, purchase_price: 0 }]);
  const removeLine = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    if (field === "product_id") {
      updated[idx] = { ...updated[idx], product_id: value as string, variant_id: "" };
    } else {
      (updated[idx] as any)[field] = value;
    }
    setItems(updated);
  };

  const getVariantsForProduct = (productId: string) =>
    variants?.filter((v) => v.product_id === productId) || [];

  const formatVariantLabel = (v: any) => {
    const parts = [v.sku];
    if (v.color?.name) parts.push(v.color.name);
    if (v.size?.label) parts.push(v.size.label);
    if (v.material?.name) parts.push(v.material.name);
    return parts.join(" | ");
  };

  const canSave = items.every((i) => i.product_id && i.variant_id && i.quantity > 0);

  const handleSave = () => {
    onSave(
      {
        date,
        notes,
        account_id: type === "in" ? accountId || null : null,
        category_id: type === "in" ? categoryId || null : null,
      },
      items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id,
        quantity: i.quantity,
        purchase_price: type === "in" ? i.purchase_price : 0,
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEntry ? "Edit" : "New"} Inventory {type === "in" ? "In" : "Out"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} />
            </div>
          </div>

          {/* Account & Category (only for IN) */}
          {type === "in" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expense Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.filter((a) => a.is_active).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expense Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_80px_100px_40px] gap-2 items-end border border-border rounded-md p-3">
                  {/* Product */}
                  <div>
                    <Label className="text-xs">Product</Label>
                    <Select value={item.product_id} onValueChange={(v) => updateLine(idx, "product_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                      <SelectContent>
                        {products?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Variant */}
                  <div>
                    <Label className="text-xs">Variant</Label>
                    <Select
                      value={item.variant_id}
                      onValueChange={(v) => updateLine(idx, "variant_id", v)}
                      disabled={!item.product_id}
                    >
                      <SelectTrigger><SelectValue placeholder="Variant" /></SelectTrigger>
                      <SelectContent>
                        {getVariantsForProduct(item.product_id).map((v) => (
                          <SelectItem key={v.id} value={v.id}>{formatVariantLabel(v)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {/* Purchase Price (only for IN) */}
                  {type === "in" ? (
                    <div>
                      <Label className="text-xs">Cost</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.purchase_price}
                        onChange={(e) => updateLine(idx, "purchase_price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeLine(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || saving}>
              {saving ? "Saving..." : editEntry ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryEntryModal;
