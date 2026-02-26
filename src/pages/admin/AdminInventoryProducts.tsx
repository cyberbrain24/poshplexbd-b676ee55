import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useInventoryProducts, useCreateInventoryProduct, useUpdateInventoryProduct, useDeleteInventoryProduct } from "@/hooks/useInventory";
import { InventoryProduct } from "@/services/inventory.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/currency";

const AdminInventoryProducts = () => {
  const { data: products, isLoading } = useInventoryProducts();
  const createMutation = useCreateInventoryProduct();
  const updateMutation = useUpdateInventoryProduct();
  const deleteMutation = useDeleteInventoryProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", unit: "pcs", purchase_price: 0, is_active: true });

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", sku: "", unit: "pcs", purchase_price: 0, is_active: true });
    setModalOpen(true);
  };

  const openEdit = (p: InventoryProduct) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, unit: p.unit, purchase_price: p.purchase_price, is_active: p.is_active });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, input: form }, {
        onSuccess: () => setModalOpen(false),
      });
    } else {
      createMutation.mutate(form, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this inventory product?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <AdminLoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory Products</h1>
          <p className="text-sm text-muted-foreground">Manage products used in inventory tracking</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New Product
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Purchase Price</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!products?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inventory products yet</TableCell></TableRow>
            ) : products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.sku || "—"}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>{formatCurrency(p.purchase_price)}</TableCell>
                <TableCell className={p.current_stock <= 0 ? "text-destructive font-medium" : ""}>{p.current_stock}</TableCell>
                <TableCell>{p.is_active ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit" : "New"} Inventory Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Fabric Roll A" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. FAB-001" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, meter" />
              </div>
            </div>
            <div>
              <Label>Default Purchase Price</Label>
              <Input type="number" min={0} step="0.01" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editProduct ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventoryProducts;
