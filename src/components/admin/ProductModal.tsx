import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Plus, Trash2, Upload, GripVertical, Play, ChevronDown, ChevronUp, Image as ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useBrands, useSizeGuides, useCareInstructions, useColors, useSizes, useMaterials, useCustomVariants } from "@/hooks/useMasterData";
import { useCreateProduct, useUpdateProduct, useAddProductImage, useDeleteProductImage, useUpdateProductImage, useAddProductVariant, useUpdateProductVariant, useDeleteProductVariant, uploadProductImage } from "@/hooks/useProducts";
import { Product, ProductFormData, VariantFormData, ProductImage } from "@/types/product";
import { toast } from "sonner";
import VariantBuilder from "@/components/admin/VariantBuilder";
import ProductImagePickerModal from "@/components/admin/ProductImagePickerModal";
import { useProductCategoryIds, useSyncProductCategories } from "@/hooks/useProductCategories";
import { useProductAppliedAttributeIds, useSyncProductAttributes, useProductAttributes, useProductVariantAttributeValues, syncVariantAttributeValues } from "@/hooks/useProductAttributes";
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
  brand_id: null,
  short_description: "",
  full_description: "",
  base_price: 0,
  youtube_url: "",
  youtube_autoplay: false,
  youtube_mute: true,
  size_guide_id: null,
  care_instruction_id: null,
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
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useCategories();
  const { data: productCategoryIds = [] } = useProductCategoryIds(product?.id);
  const syncCategories = useSyncProductCategories();
  const { data: appliedAttributeIds = [] } = useProductAppliedAttributeIds(product?.id);
  const syncAttributes = useSyncProductAttributes();

  // Derived: parent categories and their subcategories (for display grouping)
  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const { data: brands = [] } = useBrands();
  const { data: sizeGuides = [] } = useSizeGuides();
  const { data: careInstructions = [] } = useCareInstructions();
  const { data: colors = [] } = useColors();
  const { data: sizes = [] } = useSizes();
  const { data: materials = [] } = useMaterials();
  const { data: customVariants = [] } = useCustomVariants();

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
        brand_id: product.brand_id,
        short_description: product.short_description || "",
        full_description: product.full_description || "",
        base_price: product.base_price,
        youtube_url: product.youtube_url || "",
        youtube_autoplay: product.youtube_autoplay,
        youtube_mute: product.youtube_mute,
        size_guide_id: product.size_guide_id,
        care_instruction_id: product.care_instruction_id,
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
      setSelectedAttributeIds([]);
    }
  }, [product]);

  // Load multi-category selections when editing
  useEffect(() => {
    if (productCategoryIds.length > 0) {
      setSelectedCategoryIds(productCategoryIds);
    } else if (product?.category_id) {
      // Fallback: use legacy category_id if no junction data
      setSelectedCategoryIds([product.category_id]);
    }
  }, [productCategoryIds, product?.category_id]);

  // Load applied attributes when editing
  useEffect(() => {
    setSelectedAttributeIds(appliedAttributeIds);
  }, [appliedAttributeIds]);

  // Load existing variants when editing
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setVariants(product.variants.map(v => ({
        id: v.id,
        color_id: v.color_id,
        size_id: v.size_id,
        material_id: v.material_id,
        custom_variant_id: (v as any).custom_variant_id ?? null,
        sku: v.sku,
        purchase_price: v.purchase_price,
        selling_price: v.selling_price,
        is_active: v.is_active,
        image_url: v.image_url || null,
      })));
    }
  }, [product]);

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const handleSubmit = async () => {
    try {
      if (product) {
        // 1. Update product info (set category_id to first selected for backward compat)
        const updatedFormData = { ...formData, category_id: selectedCategoryIds[0] || null };
        await updateProduct.mutateAsync({ id: product.id, data: updatedFormData });

        // 2. Sync multi-category junction table
        await syncCategories.mutateAsync({ productId: product.id, categoryIds: selectedCategoryIds });
        await syncAttributes.mutateAsync({ productId: product.id, attributeIds: selectedAttributeIds });
        // 2. Sync variants for existing product
        const existingVariantIds = (product.variants || []).map(v => v.id);
        const currentVariantIds = variants.filter(v => v.id).map(v => v.id!);

        // Delete removed variants
        const deletedIds = existingVariantIds.filter(id => !currentVariantIds.includes(id));
        for (const id of deletedIds) {
          await deleteVariant.mutateAsync(id);
        }

        // Update existing variants & add new ones
        for (const variant of variants) {
          if (variant.id && existingVariantIds.includes(variant.id)) {
            // Update existing
            await updateVariant.mutateAsync({
              id: variant.id,
              data: {
                color_id: variant.color_id,
                size_id: variant.size_id,
                material_id: variant.material_id,
                custom_variant_id: variant.custom_variant_id ?? null,
                sku: variant.sku,
                purchase_price: variant.purchase_price,
                selling_price: variant.selling_price,
                is_active: variant.is_active,
                image_url: variant.image_url,
              },
            });
          } else {
            // Add new variant
            await addVariant.mutateAsync({
              productId: product.id,
              variantData: variant,
            });
          }
        }

        // Sync image sort_order and is_main for existing images
        for (const img of images) {
          if (!img.id.startsWith("temp-")) {
            await updateImage.mutateAsync({ id: img.id, sortOrder: img.sort_order, isMain: img.is_main });
          }
        }

        toast.success("Product updated successfully");
      } else {
        const createFormData = { ...formData, category_id: selectedCategoryIds[0] || null };
        const newProduct = await createProduct.mutateAsync(createFormData);

        // Sync multi-category junction table
        if (selectedCategoryIds.length > 0) {
          await syncCategories.mutateAsync({ productId: newProduct.id, categoryIds: selectedCategoryIds });
        }
        if (selectedAttributeIds.length > 0) {
          await syncAttributes.mutateAsync({ productId: newProduct.id, attributeIds: selectedAttributeIds });
        }
        
        
        // Upload images for new product
        for (const img of images) {
          let imageUrl = img.image_url;
          
          // Upload blob files to storage first
          if (imageUrl.startsWith("blob:")) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`, { type: blob.type });
            imageUrl = await uploadProductImage(file, newProduct.id);
          }
          
          await addImage.mutateAsync({
            productId: newProduct.id,
            imageUrl,
            altText: img.alt_text || undefined,
            sortOrder: img.sort_order,
            isMain: img.is_main,
            colorId: img.color_id || undefined,
          });
        }

        // Add variants for new product
        for (const variant of variants) {
          await addVariant.mutateAsync({
            productId: newProduct.id,
            variantData: variant,
          });
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

    // Capture files into array BEFORE resetting input (resetting clears the FileList)
    const fileArray = Array.from(files);

    // Reset input so the same files can be re-selected later
    if (fileInputRef.current) fileInputRef.current.value = "";

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

    // Validate and filter files
    const validFiles: File[] = [];
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" skipped — only JPEG, PNG, WebP, GIF allowed`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" skipped — exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    let uploadedCount = 0;

    try {
      if (product) {
        // Existing product: compress, then upload sequentially (more reliable than parallel for storage 520s)
        const existingUrls = new Set(images.map(i => i.image_url));
        const baseSort = images.length;

        // Compress in parallel (CPU-bound, safe)
        const compressed = await Promise.all(
          validFiles.map(async (f) => {
            try { return await compressProductImage(f); } catch { return f; }
          })
        );

        const newRows: ProductImage[] = [];
        for (let i = 0; i < compressed.length; i++) {
          const file = compressed[i];
          let imageUrl: string;
          try {
            imageUrl = await uploadProductImage(file, product.id);
          } catch (err: any) {
            console.error("Upload failed:", err);
            toast.error(`"${validFiles[i].name}" upload failed: ${err?.message || "Unknown error"}`);
            continue;
          }
          if (existingUrls.has(imageUrl)) continue;
          existingUrls.add(imageUrl);

          try {
            const inserted = await addImage.mutateAsync({
              productId: product.id,
              imageUrl,
              sortOrder: baseSort + i,
              isMain: false,
            });
            if (inserted) {
              newRows.push({
                id: inserted.id,
                product_id: product.id,
                image_url: imageUrl,
                alt_text: null,
                sort_order: baseSort + i,
                is_main: false,
                color_id: null,
                created_at: new Date().toISOString(),
              });
              uploadedCount++;
            }
          } catch (err: any) {
            console.error("DB insert failed:", err);
            toast.error(`Save failed: ${err?.message || "Unknown error"}`);
          }
        }

        if (newRows.length > 0) {
          setImages((prev) => [...newRows, ...prev].map((img, idx) => ({ ...img, sort_order: idx })));
        }
      } else {
        // New product: store as blobs locally; prepend new images so latest uploads appear first
        const newImages: ProductImage[] = validFiles.map((file, idx) => {
          const localUrl = URL.createObjectURL(file);
          return {
            id: `temp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
            product_id: "",
            image_url: localUrl,
            alt_text: null,
            sort_order: idx,
            is_main: false,
            color_id: null,
            created_at: new Date().toISOString(),
          };
        });
        setImages(prev => {
          const combined = [...newImages, ...prev];
          // Re-assign sort_order and ensure first image is main if none set
          const hasMain = combined.some(i => i.is_main);
          return combined.map((img, i) => ({
            ...img,
            sort_order: i,
            is_main: !hasMain && i === 0 ? true : img.is_main,
          }));
        });
        uploadedCount = newImages.length;
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} image${uploadedCount > 1 ? "s" : ""} uploaded`);
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(`Failed to upload images: ${error?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Get set of image URLs assigned to variants for deletion protection
  const variantAssignedUrls = useMemo(
    () => new Set(variants.map(v => v.image_url).filter(Boolean) as string[]),
    [variants]
  );

  const handleDeleteImage = async (imageId: string) => {
    const img = images.find(i => i.id === imageId);
    if (img && variantAssignedUrls.has(img.image_url)) {
      toast.error("This image is currently assigned to a variant. Please remove it from the variant before deleting.");
      return;
    }
    if (product && !imageId.startsWith("temp-")) {
      await deleteImage.mutateAsync(imageId);
      setImages(prev => prev.filter(i => i.id !== imageId));
    } else {
      setImages(prev => prev.filter(i => i.id !== imageId));
    }
  };

  const setMainImage = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_main: img.id === imageId,
    })));
  };

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setImages(prev => {
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered.map((img, i) => ({ ...img, sort_order: i }));
    });
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const addNewVariant = () => {
    setVariants(prev => [...prev, {
      color_id: null,
      size_id: null,
      material_id: null,
      custom_variant_id: null,
      sku: "",
      purchase_price: 0,
      selling_price: formData.base_price,
      is_active: true,
      image_url: null,
    }]);
  };

  const updateVariantField = (index: number, field: keyof VariantFormData, value: any) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleBuilderGenerate = useCallback((newVariants: VariantFormData[]) => {
    setVariants((prev) => [...prev, ...newVariants]);
  }, []);

  if (!isOpen) return null;

  const videoId = formData.youtube_url ? getYouTubeVideoId(formData.youtube_url) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-end">
      <div className="w-full max-w-4xl h-full bg-background overflow-y-auto animate-in slide-in-from-right">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto">
              <TabsTrigger value="info" className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2">
                Product Info
              </TabsTrigger>
              <TabsTrigger value="media" className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2">
                Media
              </TabsTrigger>
              <TabsTrigger value="variants" className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2">
                Variants
              </TabsTrigger>
              <TabsTrigger value="guides" className="data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2">
                Guides & Care
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Auto-generated if empty)</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="SKU-XXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value: 'simple' | 'variable') => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categories & Subcategories</Label>
                  <div className="border border-border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {parentCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No categories available</p>
                    ) : (
                      parentCategories.map((parent) => {
                        const children = categories.filter(c => c.parent_id === parent.id);
                        const isParentChecked = selectedCategoryIds.includes(parent.id);
                        return (
                          <div key={parent.id} className="space-y-1">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                              <Checkbox
                                checked={isParentChecked}
                                onCheckedChange={(checked) => {
                                  setSelectedCategoryIds(prev =>
                                    checked
                                      ? [...prev, parent.id]
                                      : prev.filter(id => id !== parent.id)
                                  );
                                }}
                              />
                              <span className="text-sm font-medium">{parent.name}</span>
                            </label>
                            {children.length > 0 && (
                              <div className="ml-6 space-y-0.5">
                                {children.map((child) => {
                                  const isChecked = selectedCategoryIds.includes(child.id);
                                  return (
                                    <label key={child.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          setSelectedCategoryIds(prev =>
                                            checked
                                              ? [...prev, child.id]
                                              : prev.filter(id => id !== child.id)
                                          );
                                        }}
                                      />
                                      <span className="text-sm text-muted-foreground">{child.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">{selectedCategoryIds.length} selected</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Brand / Collection</Label>
                  <Select
                    value={formData.brand_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, brand_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Brand</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief product description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  placeholder="Detailed product description"
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible on store)</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured (show on homepage)</Label>
              </div>

              <div className="pt-2 border-t border-border">
                <ProductAttributesPicker
                  selectedAttributeIds={selectedAttributeIds}
                  onChange={setSelectedAttributeIds}
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-6 space-y-6">
              {/* Product Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Product Images</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Images"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {images.map((image, idx) => (
                      <div
                        key={image.id}
                        draggable
                        onDragStart={() => setDragIndex(idx)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                        onDragEnd={() => { if (dragIndex !== null && dragOverIndex !== null) handleDragEnd(dragIndex, dragOverIndex); setDragIndex(null); setDragOverIndex(null); }}
                        onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) handleDragEnd(dragIndex, idx); }}
                        className={`relative group border ${image.is_main ? 'border-foreground' : 'border-border'} p-2 cursor-grab active:cursor-grabbing transition-opacity ${dragIndex === idx ? 'opacity-50' : ''} ${dragOverIndex === idx && dragIndex !== idx ? 'ring-2 ring-primary' : ''}`}
                      >
                        <div className="absolute top-1 left-1 z-10 bg-background/80 rounded p-0.5">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="absolute top-1 right-1 z-10 bg-background/80 rounded px-1 text-xs text-muted-foreground">
                          {idx + 1}
                        </div>
                        <img
                          src={image.image_url}
                          alt={image.alt_text || "Product"}
                          className="w-full aspect-square object-cover pointer-events-none"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setMainImage(image.id)}
                            disabled={image.is_main}
                          >
                            {image.is_main ? "Main" : "Set Main"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {image.is_main && (
                          <div className="absolute top-0 left-0 bg-foreground text-background text-xs px-2 py-1 mt-6">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
                    <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No images uploaded yet</p>
                    <p className="text-sm">Click upload to add product images</p>
                  </div>
                )}
              </div>

              {/* YouTube Video */}
              <div className="space-y-4 pt-6 border-t border-border">
                <Label>YouTube Video</Label>
                <div className="space-y-2">
                  <Input
                    value={formData.youtube_url}
                    onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  {videoId && (
                    <div className="aspect-video w-full max-w-md bg-muted">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="youtube_autoplay"
                      checked={formData.youtube_autoplay}
                      onCheckedChange={(checked) => setFormData({ ...formData, youtube_autoplay: checked })}
                    />
                    <Label htmlFor="youtube_autoplay">Autoplay</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="youtube_mute"
                      checked={formData.youtube_mute}
                      onCheckedChange={(checked) => setFormData({ ...formData, youtube_mute: checked })}
                    />
                    <Label htmlFor="youtube_mute">Muted</Label>
                  </div>
                </div>
              </div>

            </TabsContent>

            <TabsContent value="variants" className="mt-6 space-y-6">
              <div className="pb-4 border-b border-border">
                <ProductAttributesPicker
                  selectedAttributeIds={selectedAttributeIds}
                  onChange={setSelectedAttributeIds}
                />
              </div>
              {formData.product_type === "variable" ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Product Variants</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage color, size, and material combinations
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowBuilder(!showBuilder)}>
                        {showBuilder ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                        {showBuilder ? "Hide Builder" : "Auto-Generate"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={addNewVariant}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </Button>
                    </div>
                  </div>

                  {showBuilder && (
                    <VariantBuilder
                      colors={colors}
                      sizes={sizes}
                      materials={materials}
                      customVariants={customVariants}
                      existingVariants={variants}
                      basePrice={formData.base_price}
                      onGenerate={handleBuilderGenerate}
                    />
                  )}

                  {variants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Image</TableHead>
                            <TableHead>Color</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead>Custom</TableHead>
                             <TableHead>Price</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {variants.map((variant, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => setMediaPickerIndex(index)}
                                  className="w-14 h-14 border border-border flex items-center justify-center overflow-hidden hover:border-foreground/50 transition-colors"
                                >
                                  {variant.image_url ? (
                                    <img src={variant.image_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </button>
                                {variant.image_url && (
                                  <button
                                    type="button"
                                    onClick={() => updateVariantField(index, "image_url", null)}
                                    className="text-xs text-destructive hover:underline mt-1"
                                  >
                                    Remove
                                  </button>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={variant.color_id || "none"}
                                  onValueChange={(value) => updateVariantField(index, "color_id", value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue placeholder="Color" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {colors.map((c) => (
                                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={variant.size_id || "none"}
                                  onValueChange={(value) => updateVariantField(index, "size_id", value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue placeholder="Size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {sizes.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={variant.material_id || "none"}
                                  onValueChange={(value) => updateVariantField(index, "material_id", value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Material" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {materials.map((m) => (
                                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={variant.custom_variant_id || "none"}
                                  onValueChange={(value) => updateVariantField(index, "custom_variant_id", value === "none" ? null : value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Custom" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">-</SelectItem>
                                    {customVariants.map((cv) => (
                                      <SelectItem key={cv.id} value={cv.id}>{cv.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={variant.selling_price}
                                  onChange={(e) => updateVariantField(index, "selling_price", parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={variant.sku}
                                  onChange={(e) => updateVariantField(index, "sku", e.target.value)}
                                  placeholder="Auto"
                                  className="w-28"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeVariant(index)}
                                >
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
                      <p>No variants added yet</p>
                      <p className="text-sm">Click "Add Variant" or "Auto-Generate" to create combinations</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="border border-border p-8 text-center text-muted-foreground">
                  <p>Switch to "Variable" product type to manage variants</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="guides" className="mt-6 space-y-6">
              <div className="space-y-2">
                <Label>Size Guide</Label>
                <Select
                  value={formData.size_guide_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, size_guide_id: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size guide" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Size Guide</SelectItem>
                    {sizeGuides.map((guide) => (
                      <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.size_guide_id && sizeGuides.find(g => g.id === formData.size_guide_id) && (
                  <div className="mt-2 p-4 bg-muted text-sm whitespace-pre-wrap">
                    {sizeGuides.find(g => g.id === formData.size_guide_id)?.content}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Care & Cleaning Instructions</Label>
                <Select
                  value={formData.care_instruction_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, care_instruction_id: value === "none" ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select care instructions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Care Instructions</SelectItem>
                    {careInstructions.map((care) => (
                      <SelectItem key={care.id} value={care.id}>{care.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.care_instruction_id && careInstructions.find(c => c.id === formData.care_instruction_id) && (
                  <div className="mt-2 p-4 bg-muted text-sm whitespace-pre-wrap">
                    {careInstructions.find(c => c.id === formData.care_instruction_id)?.content}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || createProduct.isPending || updateProduct.isPending}>
            {product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      {/* Product Image Picker for Variant Images */}
      <ProductImagePickerModal
        isOpen={mediaPickerIndex !== null}
        onClose={() => setMediaPickerIndex(null)}
        onSelect={(url) => {
          if (mediaPickerIndex !== null) {
            updateVariantField(mediaPickerIndex, "image_url", url);
          }
        }}
        images={images}
      />
    </div>
  );
};

export default ProductModal;
