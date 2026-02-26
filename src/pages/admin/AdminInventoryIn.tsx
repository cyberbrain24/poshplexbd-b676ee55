import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useInventoryEntries, useCreateInventoryEntry, useUpdateInventoryEntry, useDeleteInventoryEntry } from "@/hooks/useInventory";
import { InventoryEntry, InventoryItemInput } from "@/services/inventory.service";
import InventoryEntryModal from "@/components/admin/InventoryEntryModal";
import { AdminLoadingSpinner } from "@/components/admin";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

const AdminInventoryIn = () => {
  const { data: entries, isLoading } = useInventoryEntries("in");
  const createMutation = useCreateInventoryEntry();
  const updateMutation = useUpdateInventoryEntry();
  const deleteMutation = useDeleteInventoryEntry();

  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<InventoryEntry | null>(null);
  const [viewEntry, setViewEntry] = useState<InventoryEntry | null>(null);

  const handleSave = (entry: any, items: InventoryItemInput[]) => {
    if (editEntry) {
      updateMutation.mutate({ id: editEntry.id, entry, items }, {
        onSuccess: () => { setModalOpen(false); setEditEntry(null); },
      });
    } else {
      createMutation.mutate({ entry: { ...entry, type: "in" }, items }, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleEdit = (e: InventoryEntry) => { setEditEntry(e); setModalOpen(true); };
  const handleDelete = (id: string) => {
    if (confirm("Delete this inventory entry? Stock will be reversed and linked transaction will be removed.")) {
      deleteMutation.mutate(id);
    }
  };

  const getTotalQty = (e: InventoryEntry) => e.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const getTotalPrice = (e: InventoryEntry) => e.items?.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0) || 0;

  if (isLoading) return <AdminLoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory In</h1>
          <p className="text-sm text-muted-foreground">Stock receiving history</p>
        </div>
        <Button onClick={() => { setEditEntry(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New Entry
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stock Type</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!entries?.length ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No entries yet</TableCell></TableRow>
            ) : entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{format(new Date(e.date), "dd MMM yyyy")}</TableCell>
                <TableCell>
                  {e.items?.some((i: any) => i.shared_variant_id) ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Shared (POD)</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Per-Product</span>
                  )}
                </TableCell>
                <TableCell>{e.items?.length || 0} item(s)</TableCell>
                <TableCell className="font-medium">{getTotalQty(e)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(getTotalPrice(e))}</TableCell>
                <TableCell>{e.account?.name || "—"}</TableCell>
                <TableCell>{e.category?.name || "—"}</TableCell>
                <TableCell>{(e as any).subcategory?.name || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{e.notes || "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setViewEntry(e)}><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(e)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InventoryEntryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditEntry(null); }}
        onSave={handleSave}
        type="in"
        editEntry={editEntry}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      {/* View Dialog */}
      <Dialog open={!!viewEntry} onOpenChange={(o) => !o && setViewEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Inventory In Details</DialogTitle>
          </DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(viewEntry.date), "dd MMM yyyy")}</div>
                <div><span className="text-muted-foreground">Account:</span> {viewEntry.account?.name || "—"}</div>
                <div><span className="text-muted-foreground">Category:</span> {viewEntry.category?.name || "—"}</div>
                <div><span className="text-muted-foreground">Subcategory:</span> {(viewEntry as any).subcategory?.name || "—"}</div>
                <div><span className="text-muted-foreground">Notes:</span> {viewEntry.notes || "—"}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Line Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewEntry.items?.map((item) => {
                    const isShared = !!(item as any).shared_variant_id;
                    const sv = (item as any).shared_variant;
                    const productName = isShared ? (sv?.sku || "Shared") : (item.product?.name || "—");
                    const variantSku = isShared 
                      ? [sv?.color?.name, sv?.size?.label, sv?.material?.name].filter(Boolean).join(" | ") 
                      : (item.variant?.sku || "—");
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{productName}</TableCell>
                      <TableCell>{variantSku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.purchase_price)}</TableCell>
                      <TableCell>{formatCurrency(item.quantity * item.purchase_price)}</TableCell>
                    </TableRow>
                    );
                  })}
                  {/* Totals row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Grand Total</TableCell>
                    <TableCell>{getTotalQty(viewEntry)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{formatCurrency(getTotalPrice(viewEntry))}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventoryIn;
