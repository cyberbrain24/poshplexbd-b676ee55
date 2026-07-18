import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Plus, Trash2, Upload, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useSizeGuides, useColors, useSizes } from "@/hooks/useMasterData";
import { useCreateProduct, useUpdateProduct, useAddProductImage, useDeleteProductImage, useUpdateProductImage, useAddProductVariant, useUpdateProductVariant, useDeleteProductVariant, uploadProductImage } from "@/hooks/useProducts";
import { Product, ProductFormData, VariantFormData, ProductImage } from "@/types/product";
import { toast } from "sonner";
import VariantBuilder from "@/components/admin/VariantBuilder";
import ProductImagePickerModal from "@/components/admin/ProductImagePickerModal";
import { useProductCategoryIds, useSyncProductCategories } from "@/hooks/useProductCategories";
import { compressProductImage } from "@/lib/imageCompress";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

const defaultFormData: ProductFormData = {
  name: "",
  sku: "",
  product_type: "simple",
  category_id: null,
  short_description: "",
  full_description: "",
  base_price: 0,
  youtube_url: "",
  youtube_autoplay: false,
  youtube_mute: true,
  size_guide_id: null,
  is_active: true,
  is_featured: false,
};

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [mediaPickerIndex, setMediaPickerIndex] = useState<number | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useCategories();
  const { data: productCategoryIds = [] } = useProductCategoryIds(product?.id);
  const syncCategories = useSyncProductCategories();
  const { data: sizeGuides = [] } = useSizeGuides();
  const { data: colors = [] } = useColors();
  const { data: sizes = [] } = useSizes();

  const parentCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const addImage = useAddProductImage();
  const deleteImage = useDeleteProductImage();
  const updateImage = useUpdateProductImage();
  const addVariant = useAddProductVariant();
  const updateVariant = useUpdateProductVariant();
  const deleteVariant = useDeleteProductVariant();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        product_type: product.product_type,
        category_id: product.category_id,
        short_description: product.short_description || "",
        full_description: product.full_description || "",
        base_price: product.base_price,
        youtube_url: product.youtube_url || "",
        youtube_autoplay: product.youtube_autoplay,
        youtube_mute: product.youtube_mute,
        size_guide_id: product.size_guide_id,
        is_active: product.is_active,
        is_featured: product.is_featured ?? false,
      });
      setImages(product.images || []);
      setVariants([]);
    } else {
      setFormData(defaultFormData);
      setImages([]);
      setVariants([]);
      setSelectedCategoryIds([]);
    }
  }, [product]);

  useEffect(() => {
    if (productCategoryIds.length > 0) setSelectedCategoryIds(productCategoryIds);
    else if (product?.category_id) setSelectedCategoryIds([product.category_id]);
  }, [productCategoryIds, product?.category_id]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setVariants(
        product.variants.map((v) => ({
          id: v.id,
          color_id: v.color_id,
          size_id: v.size_id,
          sku: v.sku,
          purchase_price: v.purchase_price,
          selling_price: v.selling_price,
          is_active: v.is_active,
          image_url: v.image_url || null,
        }))
      );
    }
  }, [product]);

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleSubmit = async () => {
    try {
      if (product) {
        const updatedFormData = { ...formData, category_id: selectedCategoryIds[0] || null };
        await updateProduct.mutateAsync({ id: product.id, data: updatedFormData });
        await syncCategories.mutateAsync({ productId: product.id, categoryIds: selectedCategoryIds });

        const existingVariantIds = (product.variants || []).map((v) => v.id);
        const currentVariantIds = variants.filter((v) => v.id).map((v) => v.id!);
        const deletedIds = existingVariantIds.filter((id) => !currentVariantIds.includes(id));
        for (const id of deletedIds) await deleteVariant.mutateAsync(id);

        for (const variant of variants) {
          if (variant.id && existingVariantIds.includes(variant.id)) {
            await updateVariant.mutateAsync({
              id: variant.id,
              data: {
                color_id: variant.color_id,
                size_id: variant.size_id,
                sku: variant.sku,
                purchase_price: variant.purchase_price,
                selling_price: variant.selling_price,
                is_active: variant.is_active,
                image_url: variant.image_url,
              },
            });
          } else {
            await addVariant.mutateAsync({ productId: product.id, variantData: variant });
          }
        }

        for (const img of images) {
          if (!img.id.startsWith("temp-")) {
            await updateImage.mutateAsync({ id: img.id, sortOrder: img.sort_order, isMain: img.is_main });
          }
        }

        toast.success("Product updated successfully");
      } else {
        const createFormData = { ...formData, category_id: selectedCategoryIds[0] || null };
        const newProduct = await createProduct.mutateAsync(createFormData);

        if (selectedCategoryIds.length > 0) {
          await syncCategories.mutateAsync({ productId: newProduct.id, categoryIds: selectedCategoryIds });
        }

        for (const img of images) {
          let imageUrl = img.image_url;
          let thumbUrl: string | null = (img as any).thumb_url ?? null;
          let mediumUrl: string | null = (img as any).medium_url ?? null;
          let largeUrl: string | null = (img as any).large_url ?? null;

          if (imageUrl.startsWith("blob:")) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `image-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`, { type: blob.type });
            const uploaded = await uploadProductImage(file, newProduct.id);
            imageUrl = uploaded.url;
            thumbUrl = uploaded.thumb_url;
            mediumUrl = uploaded.medium_url;
            largeUrl = uploaded.large_url;
          }

          await addImage.mutateAsync({
            productId: newProduct.id,
            imageUrl, thumbUrl, mediumUrl, largeUrl,
            altText: img.alt_text || undefined,
            sortOrder: img.sort_order,
            isMain: img.is_main,
            colorId: img.color_id || undefined,
          });
        }

        for (const variant of variants) {
          await addVariant.mutateAsync({ productId: newProduct.id, variantData: variant });
        }

        toast.success("Product created successfully");
      }
      onClose();
    } catch (error) {
      toast.error("Failed to save product");
      console.error(error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`"${file.name}" skipped`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`"${file.name}" exceeds 5MB`); continue; }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    setIsUploading(true);
    let uploadedCount = 0;

    try {
      if (product) {
        const existingUrls = new Set(images.map((i) => i.image_url));
        const baseSort = images.length;

        const compressed = await Promise.all(validFiles.map(async (f) => { try { return await compressProductImage(f); } catch { return f; } }));

        const newRows: ProductImage[] = [];
        for (let i = 0; i < compressed.length; i++) {
          const file = compressed[i];
          try {
            const uploaded = await uploadProductImage(file, product.id);
            if (existingUrls.has(uploaded.url)) continue;
            existingUrls.add(uploaded.url);
            const inserted = await addImage.mutateAsync({
              productId: product.id,
              imageUrl: uploaded.url,
              thumbUrl: uploaded.thumb_url,
              mediumUrl: uploaded.medium_url,
              largeUrl: uploaded.large_url,
              sortOrder: baseSort + i,
              isMain: false,
            });
            if (inserted) {
              newRows.push({
                id: inserted.id, product_id: product.id,
                image_url: uploaded.url, alt_text: null,
                sort_order: baseSort + i, is_main: false, color_id: null,
                created_at: new Date().toISOString(),
              });
              uploadedCount++;
            }
          } catch (err: any) {
            toast.error(`Upload failed: ${err?.message || "Unknown"}`);
          }
        }
        if (newRows.length > 0) setImages((prev) => [...newRows, ...prev].map((img, idx) => ({ ...img, sort_order: idx })));
      } else {
        const newImages: ProductImage[] = validFiles.map((file, idx) => ({
          id: `temp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
          product_id: "", image_url: URL.createObjectURL(file), alt_text: null,
          sort_order: idx, is_main: false, color_id: null,
          created_at: new Date().toISOString(),
        }));
        setImages((prev) => {
          const combined = [...newImages, ...prev];
          const hasMain = combined.some((i) => i.is_main);
          return combined.map((img, i) => ({ ...img, sort_order: i, is_main: !hasMain && i === 0 ? true : img.is_main }));
        });
        uploadedCount = newImages.length;
      }

      if (uploadedCount > 0) toast.success(`${uploadedCount} image${uploadedCount > 1 ? "s" : ""} uploaded`);
    } finally {
      setIsUploading(false);
    }
  };

  const variantAssignedUrls = useMemo(() => new Set(variants.map((v) => v.image_url).filter(Boolean) as string[]), [variants]);

  const handleDeleteImage = async (imageId: string) => {
    const img = images.find((i) => i.id === imageId);
    if (img && variantAssignedUrls.has(img.image_url)) {
      toast.error("Image is assigned to a variant.");
      return;
    }
    if (product && !imageId.startsWith("temp-")) {
      await deleteImage.mutateAsync(imageId);
    }
    setImages((prev) => prev.filter((i) => i.id !== imageId));
  };

  const setMainImage = (imageId: string) => {
    setImages((prev) => prev.map((img) => ({ ...img, is_main: img.id === imageId })));
  };

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered.map((img, i) => ({ ...img, sort_order: i }));
    });
    setDragIndex(null); setDragOverIndex(null);
  }, []);

  const addNewVariant = () => {
    setVariants((prev) => [...prev, {
      color_id: null, size_id: null, sku: "",
      purchase_price: 0, selling_price: formData.base_price,
      is_active: true, image_url: null,
    }]);
  };

  const updateVariantField = (index: number, field: keyof VariantFormData, value: any) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const removeVariant = (index: number) => setVariants((prev) => prev.filter((_, i) => i !== index));

  const handleBuilderGenerate = useCallback((newVariants: VariantFormData[]) => {
    setVariants((prev) => [...prev, ...newVariants]);
  }, []);

  if (!isOpen) return null;
  const videoId = formData.youtube_url ? getYouTubeVideoId(formData.youtube_url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-end">
      <div className="w-full max-w-4xl h-full bg-background overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-lg font-medium">{product ? "Edit Product" : "Add New Product"}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger value="info" className="px-4 py-2">Product Info</TabsTrigger>
              <TabsTrigger value="media" className="px-4 py-2">Media</TabsTrigger>
              <TabsTrigger value="variants" className="px-4 py-2">Variants</TabsTrigger>
              <TabsTrigger value="guides" className="px-4 py-2">Size Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Auto" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Select value={formData.product_type} onValueChange={(value: "simple" | "variable") => setFormData({ ...formData, product_type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Base Price *</Label>
                  <Input type="number" step="0.01" value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {parentCategories.map((parent) => {
                    const children = categories.filter((c) => c.parent_id === parent.id);
                    return (
                      <div key={parent.id} className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedCategoryIds.includes(parent.id)}
                            onCheckedChange={(checked) => setSelectedCategoryIds((prev) => checked ? [...prev, parent.id] : prev.filter((id) => id !== parent.id))}
                          />
                          <span className="text-sm font-medium">{parent.name}</span>
                        </label>
                        {children.length > 0 && (
                          <div className="ml-6 space-y-0.5">
                            {children.map((child) => (
                              <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedCategoryIds.includes(child.id)}
                                  onCheckedChange={(checked) => setSelectedCategoryIds((prev) => checked ? [...prev, child.id] : prev.filter((id) => id !== child.id))}
                                />
                                <span className="text-sm text-muted-foreground">{child.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Short Description</Label>
                <Textarea value={formData.short_description} onChange={(e) => setFormData({ ...formData, short_description: e.target.value })} rows={2} />
              </div>

              <div className="space-y-2">
                <Label>Full Description</Label>
                <Textarea value={formData.full_description} onChange={(e) => setFormData({ ...formData, full_description: e.target.value })} rows={4} />
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={formData.is_featured} onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })} />
                <Label>Featured</Label>
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label>Product Images</Label>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, idx) => (
                    <div key={image.id}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) handleDragEnd(dragIndex, idx); }}
                      className={`relative group border ${image.is_main ? "border-foreground" : "border-border"} p-2 cursor-grab`}>
                      <div className="absolute top-1 left-1 z-10 bg-background/80 rounded p-0.5">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <img src={image.image_url} alt="" className="w-full aspect-square object-cover pointer-events-none" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setMainImage(image.id)} disabled={image.is_main}>
                          {image.is_main ? "Main" : "Set Main"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteImage(image.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No images uploaded yet</p>
                </div>
              )}

              <div className="space-y-4 pt-6 border-t border-border">
                <Label>YouTube Video</Label>
                <Input value={formData.youtube_url} onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })} placeholder="https://youtube.com/..." />
                {videoId && (
                  <div className="aspect-video w-full max-w-md bg-muted">
                    <iframe src={`https://www.youtube.com/embed/${videoId}`} className="w-full h-full" />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="variants" className="mt-6 space-y-6">
              {formData.product_type === "variable" ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Product Variants</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowBuilder(!showBuilder)}>
                        {showBuilder ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                        {showBuilder ? "Hide Builder" : "Auto-Generate"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={addNewVariant}>
                        <Plus className="h-4 w-4 mr-2" />Add Variant
                      </Button>
                    </div>
                  </div>

                  {showBuilder && (
                    <VariantBuilder colors={colors} sizes={sizes}
                      existingVariants={variants} basePrice={formData.base_price}
                      onGenerate={handleBuilderGenerate} />
                  )}

                  {variants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Image</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((variant, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <button type="button" onClick={() => setMediaPickerIndex(index)}
                                  className="w-14 h-14 border border-border flex items-center justify-center overflow-hidden">
                                  {variant.image_url ? <img src={variant.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                                </button>
                              </TableCell>
                              <TableCell>
                                <Select value={variant.color_id || "none"} onValueChange={(v) => updateVariantField(index, "color_id", v === "none" ? null : v)}>
                                  <SelectTrigger className="w-28"><SelectValue placeholder="Color" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {colors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select value={variant.size_id || "none"} onValueChange={(v) => updateVariantField(index, "size_id", v === "none" ? null : v)}>
                                  <SelectTrigger className="w-24"><SelectValue placeholder="Size" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {sizes.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input type="number" step="0.01" value={variant.selling_price}
                                  onChange={(e) => updateVariantField(index, "selling_price", parseFloat(e.target.value) || 0)}
                                  className="w-24" />
                              </TableCell>
                              <TableCell>
                                <Input value={variant.sku} onChange={(e) => updateVariantField(index, "sku", e.target.value)} placeholder="Auto" className="w-28" />
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => removeVariant(index)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
                      <p>No variants added</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-border p-8 text-center text-muted-foreground">
                  <p>Switch to "Variable" to manage variants.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="guides" className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label>Size Guide</Label>
                <Select value={formData.size_guide_id || "none"} onValueChange={(v) => setFormData({ ...formData, size_guide_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Select size guide" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Size Guide</SelectItem>
                    {sizeGuides.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!formData.name || createProduct.isPending || updateProduct.isPending}>
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <ProductImagePickerModal
        isOpen={mediaPickerIndex !== null}
        onClose={() => setMediaPickerIndex(null)}
        onSelect={(url) => { if (mediaPickerIndex !== null) updateVariantField(mediaPickerIndex, "image_url", url); }}
        images={images}
      />
    </div>
  );
};

export default ProductModal;
