import { useState } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle } from "lucide-react";
import MasterDataModal from "@/components/admin/MasterDataModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCustomVariants,
  useCreateCustomVariant,
  useUpdateCustomVariant,
  useDeleteCustomVariant,
} from "@/hooks/useMasterData";
import { CustomVariant } from "@/types/product";
import { toast } from "sonner";
import { useAttributeDeletionCheck } from "@/hooks/useAttributeDeletionCheck";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminCustomVariants = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CustomVariant | null>(null);
  const [deleteItem, setDeleteItem] = useState<CustomVariant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items = [], isLoading } = useCustomVariants();
  const createMutation = useCreateCustomVariant();
  const updateMutation = useUpdateCustomVariant();
  const deleteMutation = useDeleteCustomVariant();
  const { blocked, checking, check, reset } = useAttributeDeletionCheck("custom-variant");

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (data: { label: string; sort_order?: number; is_active?: boolean }) => {
    try {
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, data });
        toast.success("Custom variant updated");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Custom variant created");
      }
    } catch (error) {
      toast.error("Failed to save custom variant");
    }
  };

  const handleDeleteClick = async (item: CustomVariant) => {
    setDeleteItem(item);
    reset();
    await check(item.id);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast.success("Custom variant deleted");
      setDeleteItem(null);
      reset();
    } catch (error) {
      toast.error("Failed to delete custom variant");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Custom Variants</h1>
          <p className="text-muted-foreground mt-1">
            Manage custom variant options (used alongside color and size on products)
          </p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Variant
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search custom variants..."
          className="pl-10"
        />
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Sort Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No custom variants yet</TableCell></TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.label}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sort_order}</TableCell>
                  <TableCell className="text-muted-foreground">{item.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsModalOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MasterDataModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={selectedItem ? "Edit Custom Variant" : "Add Custom Variant"}
        type="custom-variant"
        initialData={selectedItem}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => { setDeleteItem(null); reset(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {blocked ? <AlertTriangle className="h-5 w-5 text-destructive" /> : null}
              {blocked ? "Deletion Blocked" : "Delete Custom Variant"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {checking ? <p>Checking references...</p> : blocked ? (
                  <>
                    <p>
                      Cannot delete "<strong>{deleteItem?.label}</strong>" because it is used in{" "}
                      <strong>{blocked.count}</strong> product{blocked.count > 1 ? "s" : ""}. Remove or
                      replace it from those products first.
                    </p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1 mt-2">
                      <p className="font-medium text-foreground">Referenced products:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {blocked.names.map((name, i) => <li key={i}>{name}</li>)}
                        {blocked.count > 5 && <li>...and {blocked.count - 5} more</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p>Are you sure you want to delete "<strong>{deleteItem?.label}</strong>"?</p>
                )}
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

export default AdminCustomVariants;
