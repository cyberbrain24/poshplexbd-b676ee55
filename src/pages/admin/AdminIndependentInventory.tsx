import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, PackagePlus, PackageMinus, Pencil, Trash2, Package } from "lucide-react";
import {
  useInvProducts, useCreateInvProduct, useUpdateInvProduct, useDeleteInvProduct,
  useBulkStockMovement, useStockReport,
  useInvCategories, useCreateInvCategory, useUpdateInvCategory, useDeleteInvCategory,
} from "@/hooks/useIndependentInventory";
import { InvProduct, InvProductInput, StockMovement, InvCategory } from "@/services/independent-inventory.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

const AdminIndependentInventory = () => {
  const [tab, setTab] = useState("products");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");

  const { data: categories = [] } = useInvCategories();
  const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subCategories = useMemo(
    () => (categoryId ? categories.filter((c) => c.parent_id === categoryId) : []),
    [categories, categoryId]
  );

  const { data: products = [], isLoading } = useInvProducts(
    categoryId || undefined,
    subcategoryId || undefined
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Independent Inventory</h1>
          <p className="text-sm text-muted-foreground">Standalone inventory management</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="stock">Stock In / Out</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab
            products={products}
            isLoading={isLoading}
            categories={categories}
            parentCategories={parentCategories}
            subCategories={subCategories}
            categoryId={categoryId}
            setCategoryId={(v) => { setCategoryId(v); setSubcategoryId(""); }}
            subcategoryId={subcategoryId}
            setSubcategoryId={setSubcategoryId}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab categories={categories} parentCategories={parentCategories} />
        </TabsContent>

        <TabsContent value="stock">
          <StockTab products={products} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="report">
          <ReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ═══════════════════ Categories Tab ═══════════════════ */
const CategoriesTab = ({ categories, parentCategories }: { categories: InvCategory[]; parentCategories: InvCategory[] }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<InvCategory | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");

  const createMut = useCreateInvCategory();
  const updateMut = useUpdateInvCategory();
  const deleteMut = useDeleteInvCategory();

  const openCreate = (pid?: string) => {
    setEditCat(null);
    setName("");
    setParentId(pid || "");
    setModalOpen(true);
  };
  const openEdit = (c: InvCategory) => {
    setEditCat(c);
    setName(c.name);
    setParentId(c.parent_id || "");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const input = { name: name.trim(), parent_id: parentId || null };
    if (editCat) {
      updateMut.mutate({ id: editCat.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this category?")) deleteMut.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!parentCategories.length ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No categories yet</TableCell></TableRow>
            ) : parentCategories.map((c) => {
              const subs = categories.filter((s) => s.parent_id === c.id);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subs.map((s) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                          {s.name}
                          <button onClick={() => openEdit(s)} className="hover:text-primary"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => handleDelete(s.id)} className="hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </span>
                      ))}
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openCreate(c.id)}>
                        <Plus className="h-3 w-3 mr-1" />Sub
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={(o) => !o && setModalOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Parent Category</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger><SelectValue placeholder="None (top-level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top-level)</SelectItem>
                  {parentCategories.filter((p) => p.id !== editCat?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ═══════════════════ Products Tab ═══════════════════ */
interface ProductsTabProps {
  products: InvProduct[];
  isLoading: boolean;
  categories: InvCategory[];
  parentCategories: InvCategory[];
  subCategories: InvCategory[];
  categoryId: string;
  setCategoryId: (v: string) => void;
  subcategoryId: string;
  setSubcategoryId: (v: string) => void;
}

const ProductsTab = ({
  products, isLoading, categories, parentCategories, subCategories,
  categoryId, setCategoryId, subcategoryId, setSubcategoryId,
}: ProductsTabProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InvProduct | null>(null);
  const createMut = useCreateInvProduct();
  const updateMut = useUpdateInvProduct();
  const deleteMut = useDeleteInvProduct();

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: InvProduct) => { setEditProduct(p); setModalOpen(true); };

  const handleSave = (input: InvProductInput) => {
    if (editProduct) {
      updateMut.mutate({ id: editProduct.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this product?")) deleteMut.mutate(id);
  };

  const totalStockQty = products.reduce((s, p) => s + p.current_stock, 0);
  const totalStockValue = products.reduce((s, p) => s + p.current_stock * p.purchase_price, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {parentCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {subCategories.length > 0 && (
          <div className="w-48">
            <Label className="text-xs text-muted-foreground">Subcategory</Label>
            <Select value={subcategoryId} onValueChange={setSubcategoryId}>
              <SelectTrigger><SelectValue placeholder="All Subcategories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      {isLoading ? (
        <AdminLoadingSpinner />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group relative"
              >
                {/* 1:1 Product Image */}
                <div className="relative aspect-square bg-muted">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => openEdit(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 space-y-0.5">
                  <p className="text-xs font-medium truncate" title={p.name}>{p.name}</p>
                  <p className="text-lg font-bold">{p.current_stock}</p>
                  <p className="text-[10px] text-muted-foreground">{formatCurrency(p.current_stock * p.purchase_price)}</p>
                </div>
              </div>
            ))}
            {!products.length && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No products found. Add a product to get started.
              </div>
            )}
          </div>

          {products.length > 0 && (
            <div className="flex gap-6 border-t pt-4 text-sm font-medium">
              <span>Total Products: {products.length}</span>
              <span>Total Stock Qty: {totalStockQty}</span>
              <span>Total Stock Value: {formatCurrency(totalStockValue)}</span>
            </div>
          )}
        </>
      )}

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editProduct={editProduct}
        categories={categories}
        parentCategories={parentCategories}
        saving={createMut.isPending || updateMut.isPending}
      />
    </div>
  );
};

/* ═══════════════════ Product Modal ═══════════════════ */
const ProductModal = ({
  open, onClose, onSave, editProduct, categories, parentCategories, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: InvProductInput) => void;
  editProduct: InvProduct | null;
  categories: InvCategory[];
  parentCategories: InvCategory[];
  saving: boolean;
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [imageUrl, setImageUrl] = useState("");
  const [catId, setCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");

  const subCats = useMemo(
    () => (catId ? categories.filter((c) => c.parent_id === catId) : []),
    [categories, catId]
  );

  const handleOpenChange = (o: boolean) => {
    if (o) {
      setName(editProduct?.name || "");
      setSku(editProduct?.sku || "");
      setPurchasePrice(String(editProduct?.purchase_price || 0));
      setUnit(editProduct?.unit || "pcs");
      setImageUrl(editProduct?.image_url || "");
      setCatId(editProduct?.category_id || "");
      setSubCatId(editProduct?.subcategory_id || "");
    }
    if (!o) onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      sku: sku.trim() || undefined,
      purchase_price: parseFloat(purchasePrice) || 0,
      unit,
      category_id: catId || null,
      subcategory_id: subCatId || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Purchase Price</Label>
            <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
          </div>
          <div>
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={catId} onValueChange={(v) => { setCatId(v === "none" ? "" : v); setSubCatId(""); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategory</Label>
              <Select value={subCatId} onValueChange={(v) => setSubCatId(v === "none" ? "" : v)} disabled={!subCats.length}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subCats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════ Stock In/Out Tab ═══════════════════ */
const StockTab = ({ products, isLoading }: { products: InvProduct[]; isLoading: boolean }) => {
  const [type, setType] = useState<"in" | "out">("in");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<(StockMovement & { name?: string })[]>([]);
  const bulkMut = useBulkStockMovement();

  const addRow = () => setRows((prev) => [...prev, { inventory_product_id: "", quantity: 0, purchase_price: 0 }]);
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: any) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));

  const grandTotalQty = rows.reduce((s, r) => s + (r.quantity || 0), 0);
  const grandTotalValue = rows.reduce((s, r) => s + (r.quantity || 0) * (r.purchase_price || 0), 0);

  const handleSubmit = () => {
    const valid = rows.filter((r) => r.inventory_product_id && r.quantity > 0);
    if (!valid.length) return;
    bulkMut.mutate(
      { type, items: valid, date, notes },
      { onSuccess: () => { setRows([]); setNotes(""); } }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "in" | "out")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Line Total</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Select
                    value={row.inventory_product_id}
                    onValueChange={(v) => {
                      const p = products.find((pp) => pp.id === v);
                      updateRow(i, "inventory_product_id", v);
                      if (p) updateRow(i, "purchase_price", p.purchase_price);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.current_stock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={row.quantity || ""}
                    onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    value={row.purchase_price || ""}
                    onChange={(e) => updateRow(i, "purchase_price", parseFloat(e.target.value) || 0)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency((row.quantity || 0) * (row.purchase_price || 0))}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Add items below to record stock movement
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <div className="flex gap-6 text-sm font-semibold border-t pt-3">
          <span>Grand Total Qty: {grandTotalQty}</span>
          <span>Grand Total Value: {formatCurrency(grandTotalValue)}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" />Add Item
        </Button>
        <Button onClick={handleSubmit} disabled={bulkMut.isPending || !rows.some((r) => r.inventory_product_id && r.quantity > 0)}>
          {type === "in" ? <PackagePlus className="h-4 w-4 mr-1" /> : <PackageMinus className="h-4 w-4 mr-1" />}
          {bulkMut.isPending ? "Saving..." : `Submit Stock ${type === "in" ? "In" : "Out"}`}
        </Button>
      </div>
    </div>
  );
};

/* ═══════════════════ Report Tab ═══════════════════ */
const ReportTab = () => {
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: report = [], isLoading } = useStockReport(from, to);

  const totalInQty = report.reduce((s, r) => s + r.total_in_qty, 0);
  const totalInVal = report.reduce((s, r) => s + r.total_in_value, 0);
  const totalOutQty = report.reduce((s, r) => s + r.total_out_qty, 0);
  const totalOutVal = report.reduce((s, r) => s + r.total_out_value, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {isLoading ? (
        <AdminLoadingSpinner />
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock In Qty</TableHead>
                <TableHead className="text-right">Stock In Value</TableHead>
                <TableHead className="text-right">Stock Out Qty</TableHead>
                <TableHead className="text-right">Stock Out Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!report.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No stock movements in selected period
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {report.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.product_sku || "—"}</TableCell>
                      <TableCell className="text-right">{r.total_in_qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total_in_value)}</TableCell>
                      <TableCell className="text-right">{r.total_out_qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total_out_value)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>Grand Total</TableCell>
                    <TableCell className="text-right">{totalInQty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalInVal)}</TableCell>
                    <TableCell className="text-right">{totalOutQty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalOutVal)}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminIndependentInventory;
