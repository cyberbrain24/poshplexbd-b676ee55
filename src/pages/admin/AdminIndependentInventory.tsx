import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, PackagePlus, PackageMinus, Pencil, Trash2, Package, ZoomIn, Image as ImageIcon, Upload } from "lucide-react";
import {
  useInvProducts, useCreateInvProduct, useUpdateInvProduct, useDeleteInvProduct,
  useBulkStockMovement, useStockReport,
  useInvCategories, useCreateInvCategory, useUpdateInvCategory, useDeleteInvCategory,
} from "@/hooks/useIndependentInventory";
import { InvProduct, InvProductInput, StockMovement, InvCategory } from "@/services/independent-inventory.service";
import { AdminLoadingSpinner } from "@/components/admin";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import ImageLightbox from "@/components/ui/image-lightbox";
import MediaLibraryPickerModal from "@/components/admin/MediaLibraryPickerModal";

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

  // All products for stock tab (no filter)
  const { data: allProducts = [] } = useInvProducts();

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
          <StockTab allProducts={allProducts} categories={categories} isLoading={isLoading} />
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

  const openCreate = (pid?: string) => { setEditCat(null); setName(""); setParentId(pid || ""); setModalOpen(true); };
  const openEdit = (c: InvCategory) => { setEditCat(c); setName(c.name); setParentId(c.parent_id || ""); setModalOpen(true); };

  const handleSave = () => {
    if (!name.trim()) return;
    const input = { name: name.trim(), parent_id: parentId || null };
    if (editCat) {
      updateMut.mutate({ id: editCat.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => { if (confirm("Remove this category?")) deleteMut.mutate(id); };

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
          <DialogHeader><DialogTitle>{editCat ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string[]>([]);
  const createMut = useCreateInvProduct();
  const updateMut = useUpdateInvProduct();
  const deleteMut = useDeleteInvProduct();

  const openCreate = () => { setEditProduct(null); setModalOpen(true); };
  const openEdit = (p: InvProduct) => { setEditProduct(p); setModalOpen(true); };
  const openZoom = (url: string) => { setLightboxImage([url]); setLightboxOpen(true); };

  const handleSave = (input: InvProductInput) => {
    if (editProduct) {
      updateMut.mutate({ id: editProduct.id, input }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMut.mutate(input, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = (id: string) => { if (confirm("Remove this product?")) deleteMut.mutate(id); };

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
              {parentCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
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
                {subCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
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
              <div key={p.id} className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors group relative">
                <div className="relative aspect-square bg-muted">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                    {p.image_url && (
                      <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => openZoom(p.image_url!)}>
                        <ZoomIn className="h-3 w-3" />
                      </Button>
                    )}
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

      <ImageLightbox images={lightboxImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </div>
  );
};

/* ═══════════════════ Product Modal ═══════════════════ */
const ProductModal = ({
  open, onClose, onSave, editProduct, categories, parentCategories, saving,
}: {
  open: boolean; onClose: () => void; onSave: (input: InvProductInput) => void;
  editProduct: InvProduct | null; categories: InvCategory[]; parentCategories: InvCategory[]; saving: boolean;
}) => {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("0");
  const [unit, setUnit] = useState("pcs");
  const [imageUrl, setImageUrl] = useState("");
  const [catId, setCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [mediaPicker, setMediaPicker] = useState(false);

  const subCats = useMemo(
    () => (catId ? categories.filter((c) => c.parent_id === catId) : []),
    [categories, catId]
  );

  // Populate fields when modal opens or editProduct changes
  useEffect(() => {
    if (open) {
      setName(editProduct?.name || "");
      setSku(editProduct?.sku || "");
      setPurchasePrice(String(editProduct?.purchase_price || 0));
      setUnit(editProduct?.unit || "pcs");
      setImageUrl(editProduct?.image_url || "");
      setCatId(editProduct?.category_id || "");
      setSubCatId(editProduct?.subcategory_id || "");
    }
  }, [open, editProduct]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(), sku: sku.trim() || undefined, purchase_price: parseFloat(purchasePrice) || 0,
      unit, image_url: imageUrl.trim() || null, category_id: catId || null, subcategory_id: subCatId || null,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} /></div>
              <div><Label>Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div>
            </div>
            <div><Label>Purchase Price</Label><Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} /></div>
            <div>
              <Label>Product Image</Label>
              <div className="flex gap-2 items-start">
                {imageUrl ? (
                  <div className="relative w-20 h-20 border rounded overflow-hidden shrink-0">
                    <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />
                    <button onClick={() => setImageUrl("")} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border rounded flex items-center justify-center bg-muted shrink-0">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setMediaPicker(true)}>
                    <Upload className="h-3.5 w-3.5 mr-1.5" />Choose from Media
                  </Button>
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste URL..." className="text-xs h-8" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={catId} onValueChange={(v) => { setCatId(v === "none" ? "" : v); setSubCatId(""); }}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {parentCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Select value={subCatId} onValueChange={(v) => setSubCatId(v === "none" ? "" : v)} disabled={!subCats.length}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subCats.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
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
      <MediaLibraryPickerModal isOpen={mediaPicker} onClose={() => setMediaPicker(false)} onSelect={(url) => setImageUrl(url)} />
    </>
  );
};

/* ═══════════════════ Product Picker Modal for Stock ═══════════════════ */
interface ProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: InvProduct) => void;
  products: InvProduct[];
  categories: InvCategory[];
  selectedIds: string[];
}

const ProductPickerModal = ({ isOpen, onClose, onSelect, products, categories, selectedIds }: ProductPickerProps) => {
  const [catFilter, setCatFilter] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string[]>([]);

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setCatFilter("");
      setSubFilter("");
    }
  }, [isOpen]);

  const parentCats = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subCats = useMemo(() => catFilter ? categories.filter((c) => c.parent_id === catFilter) : [], [categories, catFilter]);

  const filtered = useMemo(() => {
    let list = products;
    if (subFilter) list = list.filter((p) => p.subcategory_id === subFilter);
    else if (catFilter) list = list.filter((p) => p.category_id === catFilter);
    return list;
  }, [products, catFilter, subFilter]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-background w-full max-w-4xl max-h-[85vh] flex flex-col rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium">Select Product</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          <div className="p-4 border-b border-border flex flex-wrap gap-3">
            <Select value={catFilter} onValueChange={(v) => { setCatFilter(v === "all" ? "" : v); setSubFilter(""); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {parentCats.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            {subCats.length > 0 && (
              <Select value={subFilter} onValueChange={(v) => setSubFilter(v === "all" ? "" : v)}>
                <SelectTrigger className="w-48"><SelectValue placeholder="All Subcategories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subCats.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {filtered.map((p) => {
                  const alreadyAdded = selectedIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`border rounded-lg overflow-hidden transition-colors group relative ${
                        alreadyAdded ? "border-primary/50 bg-primary/5 opacity-60" : "hover:border-primary/50 cursor-pointer"
                      }`}
                      onClick={() => !alreadyAdded && onSelect(p)}
                    >
                      <div className="relative aspect-square bg-muted">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        {p.image_url && (
                          <button
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded p-1"
                            onClick={(e) => { e.stopPropagation(); setLightboxImage([p.image_url!]); setLightboxOpen(true); }}
                          >
                            <ZoomIn className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {alreadyAdded && (
                          <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                            <Badge variant="secondary" className="text-[10px]">Added</Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-1.5">
                        <p className="text-xs font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">Stock: {p.current_stock}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border text-right">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
      <ImageLightbox images={lightboxImage} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
};

/* ═══════════════════ Stock In/Out Tab ═══════════════════ */
const StockTab = ({ allProducts, categories, isLoading }: { allProducts: InvProduct[]; categories: InvCategory[]; isLoading: boolean }) => {
  const [type, setType] = useState<"in" | "out">("in");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<(StockMovement & { name?: string; image_url?: string | null })[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const bulkMut = useBulkStockMovement();

  const selectedIds = rows.map((r) => r.inventory_product_id).filter(Boolean);

  const addProduct = (p: InvProduct) => {
    setRows((prev) => [...prev, {
      inventory_product_id: p.id,
      quantity: 1,
      purchase_price: p.purchase_price,
      name: p.name,
      image_url: p.image_url,
    }]);
  };

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
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Product</TableHead>
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
                  <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                    {row.image_url ? (
                      <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground/40" /></div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-sm">{row.name || "—"}</TableCell>
                <TableCell>
                  <Input type="number" min={1} value={row.quantity || ""} onChange={(e) => updateRow(i, "quantity", parseInt(e.target.value) || 0)} className="w-20" />
                </TableCell>
                <TableCell>
                  <Input type="number" min={0} value={row.purchase_price || ""} onChange={(e) => updateRow(i, "purchase_price", parseFloat(e.target.value) || 0)} className="w-24" />
                </TableCell>
                <TableCell className="font-medium">{formatCurrency((row.quantity || 0) * (row.purchase_price || 0))}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Click "Add Items" to select products
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
        <Button variant="outline" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />Add Items
        </Button>
        <Button onClick={handleSubmit} disabled={bulkMut.isPending || !rows.some((r) => r.inventory_product_id && r.quantity > 0)}>
          {type === "in" ? <PackagePlus className="h-4 w-4 mr-1" /> : <PackageMinus className="h-4 w-4 mr-1" />}
          {bulkMut.isPending ? "Saving..." : `Submit Stock ${type === "in" ? "In" : "Out"}`}
        </Button>
      </div>

      <ProductPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(p) => addProduct(p)}
        products={allProducts}
        categories={categories}
        selectedIds={selectedIds}
      />
    </div>
  );
};

/* ═══════════════════ Report Tab ═══════════════════ */
const ReportTab = () => {
  const [from, setFrom] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: report = [], isLoading } = useStockReport(from, to);

  const totalQty = report.reduce((s, r) => s + r.quantity, 0);
  const totalValue = report.reduce((s, r) => s + r.line_total, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
      </div>

      {isLoading ? (
        <AdminLoadingSpinner />
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!report.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No stock movements in selected period</TableCell>
                </TableRow>
              ) : (
                <>
                  {report.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                      <TableCell><Badge variant={r.type === "in" ? "default" : "secondary"}>{r.type === "in" ? "Stock In" : "Stock Out"}</Badge></TableCell>
                      <TableCell className="font-medium">{r.product_name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.product_sku || "—"}</TableCell>
                      <TableCell className="text-right">{r.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.purchase_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.line_total)}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={4}>Grand Total</TableCell>
                    <TableCell className="text-right">{totalQty}</TableCell>
                    <TableCell />
                    <TableCell className="text-right">{formatCurrency(totalValue)}</TableCell>
                    <TableCell />
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
