import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useSharedVariants, useCreateSharedVariant, useUpdateSharedVariant, useDeleteSharedVariant } from "@/hooks/useSharedVariants";
import { SharedVariant, formatSharedVariantLabel } from "@/services/shared-variant.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminSharedVariants = () => {
  const { data: variants, isLoading } = useSharedVariants();
  const createMutation = useCreateSharedVariant();
  const updateMutation = useUpdateSharedVariant();
  const deleteMutation = useDeleteSharedVariant();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SharedVariant | null>(null);

  // Form state
  const [colorId, setColorId] = useState("");
  const [sizeId, setSizeId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [lowThreshold, setLowThreshold] = useState(5);

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

  // Derive parent categories and subcategories
  const parentCategories = categories?.filter((c) => !c.parent_id) || [];
  const subcategories = categories?.filter((c) => c.parent_id === categoryId) || [];

  const openCreate = () => {
    setEditing(null);
    setColorId("");
    setSizeId("");
    setMaterialId("");
    setCategoryId("");
    setSubcategoryId("");
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
    setCategoryId(sv.category_id || "");
    setSubcategoryId(sv.subcategory_id || "");
    setSku(sv.sku);
    setPurchasePrice(sv.purchase_price);
    setLowThreshold(sv.low_stock_threshold);
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = {
      color_id: colorId || null,
      size_id: sizeId || null,
      material_id: materialId || null,
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      sku,
      purchase_price: purchasePrice,
      low_stock_threshold: lowThreshold,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload }, {
        onSuccess: () => setModalOpen(false),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this shared variant? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
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
              <TableHead>Category</TableHead>
              <TableHead>Subcategory</TableHead>
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
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No shared variants yet. Create one to start managing blank stock.
                </TableCell>
              </TableRow>
            ) : variants.map((sv) => (
              <TableRow key={sv.id}>
                <TableCell className="font-mono text-sm">{sv.sku || "—"}</TableCell>
                <TableCell>{sv.category?.name || "—"}</TableCell>
                <TableCell>{sv.subcategory?.name || "—"}</TableCell>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} Shared Variant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. BLK-XL-COT" />
            </div>
            <div>
              <Label>Category (Product Type)</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                <SelectTrigger><SelectValue placeholder="e.g. T-Shirt, Pants" /></SelectTrigger>
                <SelectContent>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {subcategories.length > 0 && (
              <div>
                <Label>Subcategory</Label>
                <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent>
                    {subcategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
