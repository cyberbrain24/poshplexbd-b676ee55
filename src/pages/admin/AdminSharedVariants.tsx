import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { useSharedVariants, useCreateSharedVariant, useUpdateSharedVariant, useDeleteSharedVariant } from "@/hooks/useSharedVariants";
import { SharedVariant } from "@/services/shared-variant.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSharedVariantCategoryIds, useSyncSharedVariantCategories } from "@/hooks/useSharedVariantCategories";
import MediaLibraryPickerModal from "@/components/admin/MediaLibraryPickerModal";

const AdminSharedVariants = () => {
  const { data: variants, isLoading } = useSharedVariants();
  const createMutation = useCreateSharedVariant();
  const updateMutation = useUpdateSharedVariant();
  const deleteMutation = useDeleteSharedVariant();
  const syncCategoriesMutation = useSyncSharedVariantCategories();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SharedVariant | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Form state
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [sku, setSku] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [lowThreshold, setLowThreshold] = useState(5);

  const { data: editingCategoryIds } = useSharedVariantCategoryIds(editing?.id);

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

  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  const getSubcategories = (parentId: string) =>
    categories?.filter((c) => c.parent_id === parentId) || [];

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

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
    setImageUrl("");
    setPurchasePrice(0);
    setLowThreshold(5);
    setModalOpen(true);
  };

  const openEdit = (sv: SharedVariant) => {
    setEditing(sv);
    setColorId(sv.color_id || "");
    setSizeId(sv.size_id || "");
    setMaterialId(sv.material_id || "");
    setSelectedCategoryIds([]);
    setSku(sv.sku);
    setImageUrl(sv.image_url || "");
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
      image_url: imageUrl || null,
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this shared variant? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const getCategoryBadges = (svId: string) => {
    if (!allSvCategories) return null;
    const links = allSvCategories.filter((l) => l.shared_variant_id === svId);
    if (!links.length) return null;
    return (
      <div className="flex flex-wrap gap-0.5">
        {links.slice(0, 3).map((l: any) => (
          <Badge key={l.category_id} variant={l.category?.parent_id ? "outline" : "secondary"} className="text-[10px] px-1 py-0">
            {l.category?.name || "?"}
          </Badge>
        ))}
        {links.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1 py-0">+{links.length - 3}</Badge>
        )}
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

      {/* Grid Layout - 8 columns */}
      {!variants?.length ? (
        <div className="border rounded-md p-12 text-center text-muted-foreground">
          No shared variants yet. Create one to start managing blank stock.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {variants.map((sv) => (
            <div
              key={sv.id}
              className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEdit(sv)}
            >
              {/* Image */}
              <div className="aspect-square bg-muted relative overflow-hidden">
                {sv.image_url ? (
                  <img
                    src={sv.image_url}
                    alt={sv.sku}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {sv.color?.hex_code ? (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: sv.color.hex_code }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                )}

                {/* Stock badge overlay */}
                <div className="absolute top-1 right-1">
                  <Badge
                    variant={sv.stock_quantity <= 0 ? "destructive" : sv.stock_quantity <= sv.low_stock_threshold ? "secondary" : "default"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {sv.stock_quantity}
                  </Badge>
                </div>

                {/* Status overlay */}
                {!sv.is_active && (
                  <div className="absolute top-1 left-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Inactive</Badge>
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(sv); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={(e) => handleDelete(sv.id, e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-2 space-y-1">
                <p className="font-mono text-xs font-medium truncate">{sv.sku || "—"}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {sv.color && (
                    <div className="flex items-center gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: sv.color.hex_code }} />
                      <span className="truncate">{sv.color.name}</span>
                    </div>
                  )}
                  {sv.size && <span>• {sv.size.label}</span>}
                </div>
                {sv.material && (
                  <p className="text-[11px] text-muted-foreground truncate">{sv.material.name}</p>
                )}
                {getCategoryBadges(sv.id)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} Shared Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image */}
            <div>
              <Label className="mb-2 block">Image</Label>
              <div className="flex items-start gap-3">
                <div
                  className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden cursor-pointer shrink-0"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Variant" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <Button variant="outline" size="sm" onClick={() => setMediaPickerOpen(true)}>
                    Choose from Media
                  </Button>
                  {imageUrl && (
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setImageUrl("")}>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

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
                <p className="text-xs text-muted-foreground mt-1">{selectedCategoryIds.length} selected</p>
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

      {/* Media Library Picker */}
      <MediaLibraryPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(url) => {
          setImageUrl(url);
          setMediaPickerOpen(false);
        }}
      />
    </div>
  );
};

export default AdminSharedVariants;
