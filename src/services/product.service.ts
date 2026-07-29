/**
 * Product Service
 */
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductFormData, ProductVariant, VariantFormData } from "@/types/product";
import { PAGINATION, STORAGE } from "@/constants";

const pathFromPublicUrl = (url: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
};

export interface ProductListResult { data: Product[]; count: number; }
export interface ProductFilters { search?: string; categoryId?: string; isActive?: boolean; }

export async function fetchProducts(
  filters: ProductFilters = {},
  page = 1,
  pageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  signal?: AbortSignal
): Promise<ProductListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name),
      images:product_images(id, image_url, alt_text, is_main, sort_order, color_id),
      variants:product_variants(
        id, sku, purchase_price, selling_price, is_active, image_url, stock_quantity, low_stock_threshold,
        color:colors(id, name, hex_code),
        size:sizes(id, label)
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.isActive !== undefined) query = query.eq("is_active", filters.isActive);

  const { data, error, count } = await query.abortSignal(signal!);
  if (error) throw error;
  return { data: (data || []) as unknown as Product[], count: count || 0 };
}

export async function fetchProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name),
      size_guide:size_guides(id, name, content),
      images:product_images(id, image_url, alt_text, is_main, sort_order, color_id),
      variants:product_variants(
        id, sku, purchase_price, selling_price, is_active, image_url, stock_quantity, low_stock_threshold,
        color:colors(id, name, hex_code),
        size:sizes(id, label)
      )
    `)
    .eq("id", productId)
    .single();

  if (error) throw error;
  return data as unknown as Product;
}

export async function createProduct(productData: ProductFormData): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(productData).select().single();
  if (error) throw error;
  return fetchProductById(data.id) as Promise<Product>;
}

export async function updateProduct(productId: string, productData: Partial<ProductFormData>): Promise<Product> {
  const { error } = await supabase.from("products").update(productData).eq("id", productId);
  if (error) throw error;
  return fetchProductById(productId) as Promise<Product>;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { data: productImages } = await supabase
    .from("product_images")
    .select("image_url, thumb_url, medium_url, large_url")
    .eq("product_id", productId);

  const imagePaths = (productImages ?? [])
    .flatMap((img: any) => [img.image_url, img.thumb_url, img.medium_url, img.large_url])
    .filter(Boolean)
    .map((url) => pathFromPublicUrl(url as string, STORAGE.PRODUCT_IMAGES_BUCKET))
    .filter(Boolean) as string[];
  if (imagePaths.length > 0) {
    await supabase.storage.from(STORAGE.PRODUCT_IMAGES_BUCKET).remove([...new Set(imagePaths)]);
  }

  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw error;
}

export async function uploadProductImage(file: File, productId: string): Promise<string> {
  if (file.size > STORAGE.MAX_FILE_SIZE) throw new Error("File size exceeds 5MB limit");
  const allowedTypes: readonly string[] = STORAGE.ALLOWED_IMAGE_TYPES;
  if (!allowedTypes.includes(file.type)) throw new Error("Invalid file type");

  const { toWebpUnder250 } = await import("@/lib/imageToWebp");
  const webpFile = await toWebpUnder250(file);
  const fileExt = webpFile.type === "image/webp" ? "webp" : (file.name.split(".").pop() || "jpg").toLowerCase();
  const baseName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const fileName = `${baseName}-${attempt}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE.PRODUCT_IMAGES_BUCKET)
      .upload(fileName, webpFile, { contentType: webpFile.type, upsert: false, cacheControl: "31536000" });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from(STORAGE.PRODUCT_IMAGES_BUCKET).getPublicUrl(fileName);
      return urlData.publicUrl;
    }
    lastError = uploadError;
    const status = (uploadError as any)?.status || (uploadError as any)?.statusCode;
    const transient = !status || [408, 425, 429, 500, 502, 503, 504, 520, 522, 524].includes(Number(status));
    if (!transient) break;
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  throw lastError || new Error("Upload failed");
}

export async function addProductImage(
  productId: string, imageUrl: string,
  options: { isMain?: boolean; altText?: string; colorId?: string } = {}
): Promise<void> {
  if (options.isMain) {
    await supabase.from("product_images").update({ is_main: false }).eq("product_id", productId);
  }
  const { error } = await supabase.from("product_images").insert({
    product_id: productId, image_url: imageUrl,
    is_main: options.isMain ?? false, alt_text: options.altText, color_id: options.colorId,
  });
  if (error) throw error;
}

export async function deleteProductImage(imageId: string): Promise<void> {
  const { data: image } = await supabase
    .from("product_images")
    .select("image_url, thumb_url, medium_url, large_url")
    .eq("id", imageId).single();

  const imagePaths = [(image as any)?.image_url, (image as any)?.thumb_url, (image as any)?.medium_url, (image as any)?.large_url]
    .filter(Boolean)
    .map((url) => pathFromPublicUrl(url as string, STORAGE.PRODUCT_IMAGES_BUCKET))
    .filter(Boolean) as string[];
  if (imagePaths.length > 0) {
    await supabase.storage.from(STORAGE.PRODUCT_IMAGES_BUCKET).remove([...new Set(imagePaths)]);
  }
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) throw error;
}

export async function addProductVariant(productId: string, variantData: VariantFormData): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({ product_id: productId, ...variantData })
    .select(`*, color:colors(id, name, hex_code), size:sizes(id, label)`)
    .single();
  if (error) throw error;
  return data as unknown as ProductVariant;
}

export async function updateProductVariant(variantId: string, variantData: Partial<VariantFormData>): Promise<void> {
  const { error } = await supabase.from("product_variants").update(variantData).eq("id", variantId);
  if (error) throw error;
}

export async function deleteProductVariant(variantId: string): Promise<void> {
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
  if (error) throw error;
}

export async function fetchProductCount(): Promise<number> {
  const { count, error } = await supabase.from("products").select("*", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}
