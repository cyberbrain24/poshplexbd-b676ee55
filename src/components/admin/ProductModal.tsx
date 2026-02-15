import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { X, Plus, Trash2, Upload, GripVertical, Play, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories, useBrands, useSizeGuides, useCareInstructions, useColors, useSizes, useMaterials } from "@/hooks/useMasterData";
import { useCreateProduct, useUpdateProduct, useAddProductImage, useDeleteProductImage, useUpdateProductImage, useAddProductVariant, useUpdateProductVariant, useDeleteProductVariant, uploadProductImage } from "@/hooks/useProducts";
import { Product, ProductFormData, VariantFormData, ProductImage } from "@/types/product";
import { toast } from "sonner";
import VariantBuilder from "@/components/admin/VariantBuilder";

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
};

const ProductModal = ({ isOpen, onClose, product }: ProductModalProps) => {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<VariantFormData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useCategories();

  // Derived: parent categories (no parent_id) and subcategories of selected parent
  const parentCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
  const subcategories = useMemo(() =>
    parentCategoryId ? categories.filter(c => c.parent_id === parentCategoryId) : [],
    [categories, parentCategoryId]
  );
  const { data: brands = [] } = useBrands();
  const { data: sizeGuides = [] } = useSizeGuides();
  const { data: careInstructions = [] } = useCareInstructions();
  const { data: colors = [] } = useColors();
  const { data: sizes = [] } = useSizes();
  const { data: materials = [] } = useMaterials();

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
      });
      setImages(product.images || []);
      setVariants([]);
    } else {
      setFormData(defaultFormData);
      setImages([]);
      setVariants([]);
      setParentCategoryId(null);
    }
  }, [product]);

  // Resolve parent category separately to avoid infinite loop
  useEffect(() => {
    if (product?.category_id && categories.length > 0) {
      const cat = categories.find(c => c.id === product.category_id);
      if (cat?.parent_id) {
        setParentCategoryId(cat.parent_id);
      } else {
        setParentCategoryId(product.category_id);
      }
    }
  }, [product?.category_id, categories.length]);

  // Load existing variants when editing
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setVariants(product.variants.map(v => ({
        id: v.id,
        color_id: v.color_id,
        size_id: v.size_id,
        material_id: v.material_id,
        sku: v.sku,
        purchase_price: v.purchase_price,
        selling_price: v.selling_price,
        is_active: v.is_active,
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
        await updateProduct.mutateAsync({ id: product.id, data: formData });
        toast.success("Product updated successfully");
      } else {
        const newProduct = await createProduct.mutateAsync(formData);
        
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

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (product) {
          // Upload directly for existing product
          const imageUrl = await uploadProductImage(file, product.id);
          await addImage.mutateAsync({
            productId: product.id,
            imageUrl,
            sortOrder: images.length,
            isMain: images.length === 0,
          });
        } else {
          // Store locally for new product
          const localUrl = URL.createObjectURL(file);
          setImages(prev => [...prev, {
            id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            product_id: "",
            image_url: localUrl,
            alt_text: null,
            sort_order: prev.length,
            is_main: prev.length === 0,
            color_id: null,
            material_id: null,
            size_id: null,
            created_at: new Date().toISOString(),
          }]);
        }
      }
      toast.success("Images uploaded");
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (product && !imageId.startsWith("temp-")) {
      await deleteImage.mutateAsync(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } else {
      setImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const setMainImage = (imageId: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      is_main: img.id === imageId,
    })));
  };

  const addNewVariant = () => {
    setVariants(prev => [...prev, {
      color_id: null,
      size_id: null,
      material_id: null,
      sku: "",
      purchase_price: 0,
      selling_price: formData.base_price,
      is_active: true,
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={parentCategoryId || "none"}
                    onValueChange={(value) => {
                      const newParentId = value === "none" ? null : value;
                      setParentCategoryId(newParentId);
                      // If this parent has no children, assign it directly; otherwise clear
                      const children = categories.filter(c => c.parent_id === newParentId);
                      if (children.length === 0) {
                        setFormData(prev => ({ ...prev, category_id: newParentId }));
                      } else {
                        setFormData(prev => ({ ...prev, category_id: null }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {parentCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subcategory{subcategories.length > 0 ? " *" : ""}</Label>
                  <Select
                    value={formData.category_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? null : value })}
                    disabled={!parentCategoryId || subcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!parentCategoryId ? "Select category first" : subcategories.length === 0 ? "No subcategories" : "Select subcategory"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {subcategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className={`relative group border ${image.is_main ? 'border-foreground' : 'border-border'} p-2`}
                      >
                        <img
                          src={image.image_url}
                          alt={image.alt_text || "Product"}
                          className="w-full aspect-square object-cover"
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
                          <div className="absolute top-0 left-0 bg-foreground text-background text-xs px-2 py-1">
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

              {/* Variation-Specific Images */}
              {(() => {
                // Dynamically detect which variation types exist in the product's variants
                const variantTypes: { key: string; label: string; values: { id: string; label: string; hex?: string }[] }[] = [];
                
                const colorMap = new Map<string, { id: string; label: string; hex: string }>();
                const materialMap = new Map<string, { id: string; label: string }>();
                const sizeMap = new Map<string, { id: string; label: string }>();
                
                variants.forEach(v => {
                  if (v.color_id) {
                    const c = colors.find(c => c.id === v.color_id);
                    if (c) colorMap.set(c.id, { id: c.id, label: c.name, hex: c.hex_code });
                  }
                  if (v.material_id) {
                    const m = materials.find(m => m.id === v.material_id);
                    if (m) materialMap.set(m.id, { id: m.id, label: m.name });
                  }
                  if (v.size_id) {
                    const s = sizes.find(s => s.id === v.size_id);
                    if (s) sizeMap.set(s.id, { id: s.id, label: s.label });
                  }
                });
                
                // Also check existing product variants for edit mode
                if (product?.variants) {
                  product.variants.forEach(v => {
                    if (v.color_id && v.color) colorMap.set(v.color.id, { id: v.color.id, label: v.color.name, hex: v.color.hex_code });
                    if (v.material_id && v.material) materialMap.set(v.material.id, { id: v.material.id, label: v.material.name });
                    if (v.size_id && v.size) sizeMap.set(v.size.id, { id: v.size.id, label: v.size.label });
                  });
                }
                
                if (colorMap.size > 0) variantTypes.push({ key: "color", label: "Color", values: [...colorMap.values()] });
                if (materialMap.size > 0) variantTypes.push({ key: "material", label: "Material", values: [...materialMap.values()] });
                if (sizeMap.size > 0) variantTypes.push({ key: "size", label: "Size", values: [...sizeMap.values()] });
                
                const hasVariantTypes = variantTypes.length > 0;
                
                return (
                  <div className="space-y-4 pt-6 border-t border-border">
                    <Label>Variation-Specific Images</Label>
                    <p className="text-sm text-muted-foreground">
                      {hasVariantTypes
                        ? `Assign images to specific variation values. Detected types: ${variantTypes.map(t => t.label).join(", ")}`
                        : "Add variants in the Variants tab first to enable variation-specific image assignment"}
                    </p>
                    {images.length > 0 && hasVariantTypes && (
                      <div className="space-y-3">
                        {images.map((image) => {
                          const currentType = image.color_id ? "color" : image.material_id ? "material" : image.size_id ? "size" : "none";
                          const currentValue = image.color_id || image.material_id || image.size_id || "none";
                          const activeType = variantTypes.find(t => t.key === currentType);

                          return (
                            <div key={image.id} className="flex items-center gap-3 p-2 border border-border">
                              <img src={image.image_url} alt="" className="w-12 h-12 object-cover flex-shrink-0" />
                              
                              {/* Variation Type - dynamic based on product variants */}
                              <Select
                                value={currentType}
                                onValueChange={() => {
                                  setImages(prev => prev.map(img =>
                                    img.id === image.id
                                      ? { ...img, color_id: null, material_id: null, size_id: null }
                                      : img
                                  ));
                                  if (product && !image.id.startsWith("temp-")) {
                                    updateImage.mutate({ id: image.id, colorId: null, materialId: null, sizeId: null });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">All</SelectItem>
                                  {variantTypes.map(t => (
                                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Variation Value - only values from this product's variants */}
                              {activeType && (
                                <Select
                                  value={currentValue}
                                  onValueChange={(value) => {
                                    const newId = value === "none" ? null : value;
                                    const updates = { color_id: null as string | null, material_id: null as string | null, size_id: null as string | null };
                                    if (currentType === "color") updates.color_id = newId;
                                    else if (currentType === "material") updates.material_id = newId;
                                    else if (currentType === "size") updates.size_id = newId;

                                    setImages(prev => prev.map(img =>
                                      img.id === image.id ? { ...img, ...updates } : img
                                    ));
                                    if (product && !image.id.startsWith("temp-")) {
                                      updateImage.mutate({ id: image.id, colorId: updates.color_id, materialId: updates.material_id, sizeId: updates.size_id });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-44">
                                    <SelectValue placeholder={`Select ${activeType.label.toLowerCase()}`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">All</SelectItem>
                                    {activeType.values.map((val: any) => (
                                      <SelectItem key={val.id} value={val.id}>
                                        {val.hex ? (
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border border-border" style={{ backgroundColor: val.hex }} />
                                            {val.label}
                                          </div>
                                        ) : val.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="variants" className="mt-6 space-y-6">
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
                      existingVariants={variants}
                      basePrice={formData.base_price}
                      onGenerate={handleBuilderGenerate}
                    />
                  )}

                  {variants.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Color</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Material</TableHead>
                          <TableHead>Purchase Price</TableHead>
                          <TableHead>Selling Price</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant, index) => (
                          <TableRow key={index}>
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
                              <Input
                                type="number"
                                step="0.01"
                                value={variant.purchase_price}
                                onChange={(e) => updateVariantField(index, "purchase_price", parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
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
    </div>
  );
};

export default ProductModal;
