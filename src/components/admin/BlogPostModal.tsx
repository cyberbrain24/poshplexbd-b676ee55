import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Search } from "lucide-react";
import { BlogPost, useBlogCategories, useCreateBlogPost, useUpdateBlogPost, useBlogPostProducts, useUpdateBlogPostProducts } from "@/hooks/useBlog";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AiGenerateButton from "./AiGenerateButton";
import SeoPreviewCard from "./SeoPreviewCard";

interface BlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
}

interface FormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image: string;
  category_id: string;
  status: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
}

const BlogPostModal = ({ isOpen, onClose, post }: BlogPostModalProps) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { data: categories = [] } = useBlogCategories();
  const { data: products = [] } = useProducts();
  const { data: postProducts = [] } = useBlogPostProducts(post?.id || "");
  
  const createMutation = useCreateBlogPost();
  const updateMutation = useUpdateBlogPost();
  const updateProductsMutation = useUpdateBlogPostProducts();
  
  const isEditing = !!post;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      cover_image: "",
      category_id: "",
      status: "draft",
      meta_title: "",
      meta_description: "",
      focus_keyword: "",
    },
  });

  const title = watch("title");
  const content = watch("content");
  const focusKeyword = watch("focus_keyword");
  const metaTitle = watch("meta_title");
  const metaDescription = watch("meta_description");
  const slug = watch("slug");

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        content: post.content || "",
        excerpt: post.excerpt || "",
        cover_image: post.cover_image || "",
        category_id: post.category_id || "",
        status: post.status,
        meta_title: post.meta_title || "",
        meta_description: post.meta_description || "",
        focus_keyword: post.focus_keyword || "",
      });
      setCoverPreview(post.cover_image);
      // Load linked products
      const productIds = postProducts.map((pp: any) => pp.product_id);
      setSelectedProducts(productIds);
    } else {
      reset({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        cover_image: "",
        category_id: "",
        status: "draft",
        meta_title: "",
        meta_description: "",
        focus_keyword: "",
      });
      setCoverPreview(null);
      setSelectedProducts([]);
    }
  }, [post, reset, postProducts]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const newSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", newSlug);
    }
  }, [title, isEditing, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setValue("cover_image", publicUrl);
      setCoverPreview(publicUrl);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  const onSubmit = async (data: FormData) => {
    try {
      const postData = {
        ...data,
        category_id: data.category_id || null,
        author_id: null,
        published_at: data.status === "published" ? new Date().toISOString() : null,
        ai_generated: false,
      };

      let savedPost;
      if (isEditing) {
        savedPost = await updateMutation.mutateAsync({ id: post.id, ...postData });
        await updateProductsMutation.mutateAsync({ postId: post.id, productIds: selectedProducts });
      } else {
        savedPost = await createMutation.mutateAsync(postData as any);
        if (savedPost && selectedProducts.length > 0) {
          await updateProductsMutation.mutateAsync({ postId: savedPost.id, productIds: selectedProducts });
        }
      }
      onClose();
    } catch (error) {
      console.error("Failed to save post:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Post" : "Create Post"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="products">Shop The Look</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] pr-4">
              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                      placeholder="Post title"
                    />
                    {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      {...register("slug", { required: "Slug is required" })}
                      placeholder="post-slug"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={watch("category_id")}
                      onValueChange={(val) => setValue("category_id", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.is_active).map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={watch("status")}
                      onValueChange={(val) => setValue("status", val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex gap-4">
                    {coverPreview ? (
                      <div className="relative w-40 h-24">
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded" />
                        <button
                          type="button"
                          onClick={() => { setCoverPreview(null); setValue("cover_image", ""); }}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded cursor-pointer hover:bg-muted/50">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content">Content</Label>
                    <AiGenerateButton
                      type="blog_content"
                      context={{ title, focus_keyword: focusKeyword }}
                      onGenerated={(result) => setValue("content", result as string)}
                      disabled={!title}
                    />
                  </div>
                  <Textarea
                    id="content"
                    {...register("content")}
                    placeholder="Write your blog content here... (HTML supported)"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length} characters
                  </p>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <AiGenerateButton
                      type="blog_excerpt"
                      context={{ title, content }}
                      onGenerated={(result) => setValue("excerpt", result as string)}
                      disabled={!title}
                    />
                  </div>
                  <Textarea
                    id="excerpt"
                    {...register("excerpt")}
                    placeholder="Brief summary for listings..."
                    className="min-h-[80px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="focus_keyword">Focus Keyword</Label>
                  <Input
                    id="focus_keyword"
                    {...register("focus_keyword")}
                    placeholder="e.g., streetwear fashion"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>SEO Meta Tags</Label>
                    <AiGenerateButton
                      type="meta_tags"
                      context={{ title, content, focus_keyword: focusKeyword }}
                      onGenerated={(result) => {
                        if (typeof result === 'object') {
                          setValue("meta_title", result.meta_title);
                          setValue("meta_description", result.meta_description);
                        }
                      }}
                      disabled={!title}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    {...register("meta_title")}
                    placeholder="SEO title (max 60 chars)"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">{metaTitle.length}/60 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    {...register("meta_description")}
                    placeholder="SEO description (max 160 chars)"
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">{metaDescription.length}/160 characters</p>
                </div>

                {/* Live Preview */}
                <SeoPreviewCard
                  title={metaTitle || title}
                  description={metaDescription}
                  url={`poshplex.lovable.app/blog/${slug}`}
                />
              </TabsContent>

              <TabsContent value="products" className="space-y-4 mt-0">
                <p className="text-sm text-muted-foreground">
                  Link products to this post for "Shop The Look" section.
                </p>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map(id => {
                      const product = products.find(p => p.id === id);
                      return product ? (
                        <Badge key={id} variant="secondary" className="gap-1">
                          {product.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => toggleProduct(id)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                  {filteredProducts.slice(0, 30).map(product => {
                    const isSelected = selectedProducts.includes(product.id);
                    const mainImage = product.images?.find((img: any) => img.is_main)?.image_url || product.images?.[0]?.image_url;
                    return (
                      <div
                        key={product.id}
                        onClick={() => toggleProduct(product.id)}
                        className={`p-2 border rounded cursor-pointer transition-colors ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="aspect-square mb-2 bg-muted rounded overflow-hidden">
                          {mainImage ? (
                            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">${product.base_price}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? "Save Changes" : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BlogPostModal;
