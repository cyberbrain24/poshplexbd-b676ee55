import { useState } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import MasterDataModal from "@/components/admin/MasterDataModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/useMasterData";
import { Brand } from "@/types/product";
import { toast } from "sonner";
import { useAttributeDeletionCheck } from "@/hooks/useAttributeDeletionCheck";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminBrands = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Brand | null>(null);
  const [deleteItem, setDeleteItem] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items = [], isLoading } = useBrands();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();
  const { blocked, checking, check, reset } = useAttributeDeletionCheck("brand");

  const filteredItems = items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSave = async (data: { name: string }) => {
    try {
      if (selectedItem) { await updateMutation.mutateAsync({ id: selectedItem.id, data }); toast.success("Brand updated"); }
      else { await createMutation.mutateAsync(data); toast.success("Brand created"); }
    } catch (error) { toast.error("Failed to save brand"); }
  };

  const handleDeleteClick = async (item: Brand) => { setDeleteItem(item); reset(); await check(item.id); };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try { await deleteMutation.mutateAsync(deleteItem.id); toast.success("Brand deleted"); setDeleteItem(null); reset(); }
    catch (error) { toast.error("Failed to delete brand"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Brands</h1>
          <p className="text-muted-foreground mt-1">Manage product brands & collections</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Brand</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search brands..." className="pl-10" />
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Created</TableHead><TableHead className="w-24">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
            : filteredItems.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No brands found</TableCell></TableRow>
            : filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MasterDataModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} title={selectedItem ? "Edit Brand" : "Add Brand"} type="brand" initialData={selectedItem} />

      <AlertDialog open={!!deleteItem} onOpenChange={() => { setDeleteItem(null); reset(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {blocked ? <AlertTriangle className="h-5 w-5 text-destructive" /> : null}
              {blocked ? "Deletion Blocked" : "Delete Brand"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {checking ? <p>Checking references...</p> : blocked ? (
                  <>
                    <p>Cannot delete "<strong>{deleteItem?.name}</strong>" because it is used in <strong>{blocked.count}</strong> product{blocked.count > 1 ? "s" : ""}. Remove or replace it from those products first.</p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1 mt-2">
                      <p className="font-medium text-foreground">Referenced products:</p>
                      <ul className="list-disc list-inside text-muted-foreground">{blocked.names.map((n, i) => <li key={i}>{n}</li>)}{blocked.count > 5 && <li>...and {blocked.count - 5} more</li>}</ul>
                    </div>
                  </>
                ) : <p>Are you sure you want to delete "<strong>{deleteItem?.name}</strong>"?</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!blocked && !checking && <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBrands;
