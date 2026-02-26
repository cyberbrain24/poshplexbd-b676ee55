import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useAccounts, useTransactionCategories } from "@/hooks";
import { useInventoryProducts } from "@/hooks/useInventory";
import { InventoryEntry, InventoryItemInput } from "@/services/inventory.service";
import { formatCurrency } from "@/lib/currency";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (entry: { date: string; notes?: string; account_id?: string | null; category_id?: string | null; subcategory_id?: string | null }, items: InventoryItemInput[]) => void;
  type: "in" | "out";
  editEntry?: InventoryEntry | null;
  saving?: boolean;
}

interface LineItem {
  inventory_product_id: string;
  quantity: number;
  purchase_price: number;
}

const InventoryEntryModal = ({ open, onClose, onSave, type, editEntry, saving }: Props) => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([{ inventory_product_id: "", quantity: 1, purchase_price: 0 }]);

  const { data: accounts } = useAccounts();
  const { data: categories } = useTransactionCategories("expense");
  const { data: inventoryProducts } = useInventoryProducts();

  const parentCategories = useMemo(() => categories?.filter((c) => !c.parent_id) || [], [categories]);
  const subcategories = useMemo(() => categories?.filter((c) => c.parent_id === categoryId) || [], [categories, categoryId]);

  useEffect(() => {
    if (editEntry) {
      setDate(editEntry.date);
      setNotes(editEntry.notes || "");
      setAccountId(editEntry.account_id || "");
      setCategoryId(editEntry.category_id || "");
      setSubcategoryId((editEntry as any).subcategory_id || "");
      if (editEntry.items?.length) {
        setItems(editEntry.items.map((i) => ({
          inventory_product_id: i.inventory_product_id,
          quantity: i.quantity,
          purchase_price: i.purchase_price,
        })));
      }
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setAccountId("");
      setCategoryId("");
      setSubcategoryId("");
      setItems([{ inventory_product_id: "", quantity: 1, purchase_price: 0 }]);
    }
  }, [editEntry, open]);

  useEffect(() => {
    if (!editEntry) setSubcategoryId("");
  }, [categoryId]);

  const addLine = () => setItems([...items, { inventory_product_id: "", quantity: 1, purchase_price: 0 }]);
  const removeLine = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const grandTotalQty = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const grandTotalPrice = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.purchase_price || 0), 0);

  const canSave = items.every((i) => i.inventory_product_id && i.quantity > 0);

  const handleSave = () => {
    onSave(
      {
        date,
        notes,
        account_id: type === "in" ? accountId || null : null,
        category_id: type === "in" ? categoryId || null : null,
        subcategory_id: type === "in" ? subcategoryId || null : null,
      },
      items.map((i) => ({
        inventory_product_id: i.inventory_product_id,
        quantity: i.quantity,
        purchase_price: type === "in" ? i.purchase_price : 0,
      }))
    );
  };

  const activeProducts = inventoryProducts?.filter(p => p.is_active) || [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEntry ? "Edit" : "New"} Inventory {type === "in" ? "In" : "Out"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} />
            </div>
          </div>

          {type === "in" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {parentCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {subcategories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Expense Subcategory</Label>
                    <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                      <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                      <SelectContent>
                        {subcategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
                <div key={idx} className={`grid gap-2 items-end border border-border rounded-md p-3 ${type === "in" ? "grid-cols-[1fr_80px_100px_40px]" : "grid-cols-[1fr_80px_40px]"}`}>
                  <div>
                    <Label className="text-xs">Product</Label>
                    <Select value={item.inventory_product_id} onValueChange={(v) => updateLine(idx, "inventory_product_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {activeProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{p.sku ? ` (${p.sku})` : ""} — {p.unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateLine(idx, "quantity", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  {type === "in" && (
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
                  )}

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

            {/* Grand Totals */}
            <div className="mt-4 flex justify-end">
              <div className="bg-muted rounded-md p-3 space-y-1 min-w-[220px]">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Qty:</span>
                  <span className="font-semibold">{grandTotalQty}</span>
                </div>
                {type === "in" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grand Total:</span>
                    <span className="font-semibold">{formatCurrency(grandTotalPrice)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

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
