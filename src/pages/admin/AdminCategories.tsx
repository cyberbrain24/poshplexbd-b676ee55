import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, ChevronRight, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import MasterDataModal from "@/components/admin/MasterDataModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories } from "@/hooks/useMasterData";
import { Category } from "@/types/product";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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

const AdminCategories = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Category | null>(null);
  const [deleteItem, setDeleteItem] = useState<Category | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState<{ count: number; names: string[] } | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items = [], isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  // Organize categories into hierarchy sorted by sort_order
  const organizedCategories = useMemo(() => {
    const parentCategories = items
      .filter(item => !item.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const result: (Category & { isChild?: boolean; parentName?: string })[] = [];
    
    parentCategories.forEach(parent => {
      result.push(parent);
      const children = items
        .filter(item => item.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      children.forEach(child => {
        result.push({ ...child, isChild: true, parentName: parent.name });
      });
    });
    
    // Add orphaned subcategories
    const orphans = items.filter(item => item.parent_id && !items.find(p => p.id === item.parent_id));
    orphans.forEach(orphan => {
      result.push({ ...orphan, isChild: true, parentName: 'Unknown' });
    });
    
    return result;
  }, [items]);

  const filteredItems = organizedCategories.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubcategoryCount = (parentId: string) => {
    return items.filter(item => item.parent_id === parentId).length;
  };

  const handleMoveUp = (item: Category & { isChild?: boolean }) => {
    const siblings = item.isChild
      ? items.filter(c => c.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order)
      : items.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx <= 0) return;

    const updates = [
      { id: siblings[idx].id, sort_order: siblings[idx - 1].sort_order },
      { id: siblings[idx - 1].id, sort_order: siblings[idx].sort_order },
    ];
    reorderMutation.mutate(updates);
  };

  const handleMoveDown = (item: Category & { isChild?: boolean }) => {
    const siblings = item.isChild
      ? items.filter(c => c.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order)
      : items.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx < 0 || idx >= siblings.length - 1) return;

    const updates = [
      { id: siblings[idx].id, sort_order: siblings[idx + 1].sort_order },
      { id: siblings[idx + 1].id, sort_order: siblings[idx].sort_order },
    ];
    reorderMutation.mutate(updates);
  };

  const canMoveUp = (item: Category & { isChild?: boolean }) => {
    const siblings = item.isChild
      ? items.filter(c => c.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order)
      : items.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    return siblings.findIndex(s => s.id === item.id) > 0;
  };

  const canMoveDown = (item: Category & { isChild?: boolean }) => {
    const siblings = item.isChild
      ? items.filter(c => c.parent_id === item.parent_id).sort((a, b) => a.sort_order - b.sort_order)
      : items.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex(s => s.id === item.id);
    return idx >= 0 && idx < siblings.length - 1;
  };

  const handleSave = async (data: any) => {
    try {
      // Strip UI-only fields before sending to database
      const { isChild, parentName, ...dbData } = data;
      if (selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, data: dbData as { name: string; parent_id?: string; image_url?: string } });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync(dbData as { name: string; parent_id?: string; image_url?: string });
        toast.success("Category created");
      }
    } catch (error) {
      toast.error("Failed to save category");
    }
  };

  const handleDeleteClick = async (item: Category) => {
    setCheckingDelete(true);
    setDeleteBlocked(null);
    setDeleteItem(item);

    const categoryIds = [item.id, ...items.filter(c => c.parent_id === item.id).map(c => c.id)];
    const { data: products, count } = await supabase
      .from("products")
      .select("name", { count: "exact" })
      .in("category_id", categoryIds)
      .limit(5);

    if (count && count > 0) {
      setDeleteBlocked({
        count,
        names: (products || []).map(p => p.name),
      });
    }
    setCheckingDelete(false);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast.success("Category deleted");
      setDeleteItem(null);
      setDeleteBlocked(null);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage product categories &amp; display order</p>
        </div>
        <Button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="pl-10"
        />
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} className={item.isChild ? "bg-muted/30" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canMoveUp(item) || reorderMutation.isPending}
                        onClick={() => handleMoveUp(item)}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canMoveDown(item) || reorderMutation.isPending}
                        onClick={() => handleMoveDown(item)}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.image_url ? (
                      <div className="w-12 h-12 overflow-hidden bg-muted">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.isChild && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.isChild ? (
                      <Badge variant="outline" className="text-xs">Sub of {item.parentName}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Main Category</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {!item.isChild ? getSubcategoryCount(item.id) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
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
        title={selectedItem ? "Edit Category" : "Add Category"}
        type="category"
        initialData={selectedItem}
      />

      <AlertDialog open={!!deleteItem} onOpenChange={() => { setDeleteItem(null); setDeleteBlocked(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteBlocked ? <AlertTriangle className="h-5 w-5 text-destructive" /> : null}
              {deleteBlocked ? "Deletion Blocked" : "Delete Category"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {checkingDelete ? (
                  <p>Checking references...</p>
                ) : deleteBlocked ? (
                  <>
                    <p>Cannot delete "<strong>{deleteItem?.name}</strong>" because it contains <strong>{deleteBlocked.count}</strong> product{deleteBlocked.count > 1 ? "s" : ""}.</p>
                    <div className="bg-muted p-3 rounded text-sm space-y-1 mt-2">
                      <p className="font-medium text-foreground">Referenced products:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {deleteBlocked.names.map((name, i) => <li key={i}>{name}</li>)}
                        {deleteBlocked.count > 5 && <li>...and {deleteBlocked.count - 5} more</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Are you sure you want to delete "<strong>{deleteItem?.name}</strong>"?</p>
                    {!deleteItem?.parent_id && getSubcategoryCount(deleteItem?.id || '') > 0 && (
                      <p className="text-destructive">
                        Warning: This category has {getSubcategoryCount(deleteItem?.id || '')} subcategories that will become orphaned.
                      </p>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteBlocked && !checkingDelete && (
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCategories;
