import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useSharedVariants, useCreateSharedVariant, useUpdateSharedVariant, useDeleteSharedVariant } from "@/hooks/useSharedVariants";
import { SharedVariant } from "@/services/shared-variant.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSharedVariantCategoryIds, useSyncSharedVariantCategories } from "@/hooks/useSharedVariantCategories";

const AdminSharedVariants = () => {
  const { data: variants, isLoading } = useSharedVariants();
  const createMutation = useCreateSharedVariant();
  const updateMutation = useUpdateSharedVariant();
  const deleteMutation = useDeleteSharedVariant();
  const syncCategoriesMutation = useSyncSharedVariantCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SharedVariant | null>(null);

  // Form state
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [lowThreshold, setLowThreshold] = useState(5);

  // Fetch editing shared variant's categories
  const { data: editingCategoryIds } = useSharedVariantCategoryIds(editing?.id);

  // Sync selected categories when editing
  useEffect(() => {
    if (editing && editingCategoryIds) {
      setSelectedCategoryIds(editingCategoryIds);
    }
  }, [editing, editingCategoryIds]);

  // Fetch attribute lists
  const { data: colors } = useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data } = await supabase.from("colors").select("id, name, hex_code").order("name");
      return data || [];
    },
  });
  const { data: sizes } = useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data } = await supabase.from("sizes").select("id, label").order("sort_order");
      return data || [];
    },
  });
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data } = await supabase.from("materials").select("id, name").order("name");
      return data || [];
    },
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, parent_id").order("sort_order");
      return data || [];
    },
  });

  // Fetch all shared variant category links for display
  const { data: allSvCategories } = useQuery({
    queryKey: ["shared-variant-categories-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_variant_categories")
        .select("shared_variant_id, category_id, category:categories(id, name, parent_id)");
      if (error) throw error;
      return data || [];
    },
  });

  // Derive parent categories and their children
  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  const getSubcategories = (parentId: string) =>
    categories?.filter((c) => c.parent_id === parentId) || [];

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Toggle parent + all its children
  const toggleParent = (parentId: string) => {
    const childIds = getSubcategories(parentId).map((c) => c.id);
    const allIds = [parentId, ...childIds];
    const allSelected = allIds.every((id) => selectedCategoryIds.includes(id));
    if (allSelected) {
      setSelectedCategoryIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedCategoryIds((prev) => [...new Set([...prev, ...allIds])]);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setColorId("");
    setSizeId("");
    setMaterialId("");
    setSelectedCategoryIds([]);
    setSku("");
    setPurchasePrice(0);
    setLowThreshold(5);
    setModalOpen(true);
  };

  const openEdit = (sv: SharedVariant) => {
    setEditing(sv);
    setColorId(sv.color_id || "");
    setSizeId(sv.size_id || "");
    setMaterialId(sv.material_id || "");
    setSelectedCategoryIds([]); // Will be populated by useEffect
    setSku(sv.sku);
    setPurchasePrice(sv.purchase_price);
    setLowThreshold(sv.low_stock_threshold);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      color_id: colorId || null,
      size_id: sizeId || null,
      material_id: materialId || null,
      category_id: null as string | null,
      subcategory_id: null as string | null,
      sku,
      purchase_price: purchasePrice,
      low_stock_threshold: lowThreshold,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => {
          syncCategoriesMutation.mutate({
            sharedVariantId: editing.id,
            categoryIds: selectedCategoryIds,
          });
          setModalOpen(false);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data: any) => {
          if (data?.id) {
            syncCategoriesMutation.mutate({
              sharedVariantId: data.id,
              categoryIds: selectedCategoryIds,
            });
          }
          setModalOpen(false);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this shared variant? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Helper: get category names for a shared variant from junction data
  const getCategoryBadges = (svId: string) => {
    if (!allSvCategories) return null;
    const links = allSvCategories.filter((l) => l.shared_variant_id === svId);
    if (!links.length) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {links.map((l: any) => (
          <Badge key={l.category_id} variant={l.category?.parent_id ? "outline" : "secondary"} className="text-xs">
            {l.category?.name || "Unknown"}
          </Badge>
        ))}
      </div>
    );
  };

  if (isLoading) return <AdminLoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shared Variants</h1>
          <p className="text-sm text-muted-foreground">Physical blank stock pool (POD model)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Shared Variant
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!variants?.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No shared variants yet. Create one to start managing blank stock.
                </TableCell>
              </TableRow>
            ) : variants.map((sv) => (
              <TableRow key={sv.id}>
                <TableCell className="font-mono text-sm">{sv.sku || "—"}</TableCell>
                <TableCell>{getCategoryBadges(sv.id)}</TableCell>
                <TableCell>
                  {sv.color ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: sv.color.hex_code }} />
                      {sv.color.name}
                    </div>
                  ) : "—"}
                </TableCell>
                <TableCell>{sv.size?.label || "—"}</TableCell>
                <TableCell>{sv.material?.name || "—"}</TableCell>
                <TableCell className="text-right font-medium">
                  <Badge variant={sv.stock_quantity <= 0 ? "destructive" : sv.stock_quantity <= sv.low_stock_threshold ? "secondary" : "default"}>
                    {sv.stock_quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{sv.low_stock_threshold}</TableCell>
                <TableCell>
                  <Badge variant={sv.is_active ? "default" : "secondary"}>
                    {sv.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(sv)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(sv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} Shared Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. BLK-XL-COT" />
            </div>

            {/* Multi-Category Selection */}
            <div>
              <Label className="mb-2 block">Categories & Subcategories</Label>
              <div className="border rounded-md p-3 space-y-3 max-h-48 overflow-y-auto">
                {parentCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No categories found</p>
                ) : parentCategories.map((parent) => {
                  const children = getSubcategories(parent.id);
                  const allIds = [parent.id, ...children.map((c) => c.id)];
                  const allSelected = allIds.every((id) => selectedCategoryIds.includes(id));
                  const someSelected = allIds.some((id) => selectedCategoryIds.includes(id)) && !allSelected;

                  return (
                    <div key={parent.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${parent.id}`}
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={() => toggleParent(parent.id)}
                        />
                        <label htmlFor={`cat-${parent.id}`} className="text-sm font-medium cursor-pointer">
                          {parent.name}
                        </label>
                      </div>
                      {children.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {children.map((child) => (
                            <div key={child.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`cat-${child.id}`}
                                checked={selectedCategoryIds.includes(child.id)}
                                onCheckedChange={() => toggleCategory(child.id)}
                              />
                              <label htmlFor={`cat-${child.id}`} className="text-sm cursor-pointer">
                                {child.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedCategoryIds.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCategoryIds.length} selected
                </p>
              )}
            </div>

            <div>
              <Label>Color</Label>
              <Select value={colorId} onValueChange={setColorId}>
                <SelectTrigger><SelectValue placeholder="Select color" /></SelectTrigger>
                <SelectContent>
                  {colors?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Select value={sizeId} onValueChange={setSizeId}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {sizes?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Material</Label>
              <Select value={materialId} onValueChange={setMaterialId}>
                <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                <SelectContent>
                  {materials?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price</Label>
                <Input type="number" min={0} value={purchasePrice} onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <Label>Low Stock Threshold</Label>
                <Input type="number" min={0} value={lowThreshold} onChange={(e) => setLowThreshold(parseInt(e.target.value) || 5)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!sku || createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSharedVariants;
