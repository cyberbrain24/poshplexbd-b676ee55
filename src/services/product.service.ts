/**
 * Product Service
 * Encapsulates all product-related database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductFormData, ProductVariant, VariantFormData } from "@/types/product";
import { PAGINATION, STORAGE } from "@/constants";

export interface ProductListResult {
  data: Product[];
  count: number;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}

/**
 * Fetch paginated products with optional filters
 */
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
      brand:brands(id, name),
      images:product_images(id, image_url, alt_text, is_main, sort_order, color_id),
      variants:product_variants(
        id, sku, purchase_price, selling_price, is_active, image_url, stock_quantity, low_stock_threshold,
        color:colors(id, name, hex_code),
        size:sizes(id, label),
        material:materials(id, name),
        custom_variant:custom_variants(id, label)
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.brandId) {
    query = query.eq("brand_id", filters.brandId);
  }
  if (filters.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  const { data, error, count } = await query.abortSignal(signal!);

  if (error) throw error;

  return {
    data: (data || []) as unknown as Product[],
    count: count || 0,
  };
}

/**
 * Fetch single product by ID
 */
export async function fetchProductById(productId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(id, name),
      brand:brands(id, name),
      size_guide:size_guides(id, name, content),
      care_instruction:care_instructions(id, name, content),
      images:product_images(id, image_url, alt_text, is_main, sort_order, color_id),
      variants:product_variants(
        id, sku, purchase_price, selling_price, is_active, image_url, stock_quantity, low_stock_threshold,
        color:colors(id, name, hex_code),
        size:sizes(id, label),
        material:materials(id, name),
        custom_variant:custom_variants(id, label)
      )
    `)
    .eq("id", productId)
    .single();

  if (error) throw error;

  return data as unknown as Product;
}

/**
 * Create a new product
 */
export async function createProduct(productData: ProductFormData): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) throw error;

  return fetchProductById(data.id) as Promise<Product>;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  productData: Partial<ProductFormData>
): Promise<Product> {
  const { error } = await supabase
    .from("products")
    .update(productData)
    .eq("id", productId);

  if (error) throw error;

  return fetchProductById(productId) as Promise<Product>;
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<void> {
  // Delete related data first
  await supabase.from("product_images").delete().eq("product_id", productId);
  await supabase.from("product_variants").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) throw error;
}

/**
 * Upload product image to storage
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  // Validate file
  if (file.size > STORAGE.MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }
  const allowedTypes: readonly string[] = STORAGE.ALLOWED_IMAGE_TYPES;
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, GIF");
  }

  const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
  const baseName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Retry transient storage failures (520/timeouts) up to 3 attempts with backoff
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const fileName = `${baseName}-${attempt}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE.PRODUCT_IMAGES_BUCKET)
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from(STORAGE.PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(fileName);
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

/**
 * Add image record to product
 */
export async function addProductImage(
  productId: string,
  imageUrl: string,
  options: { isMain?: boolean; altText?: string; colorId?: string } = {}
): Promise<void> {
  // If setting as main, unset other main images
  if (options.isMain) {
    await supabase
      .from("product_images")
      .update({ is_main: false })
      .eq("product_id", productId);
  }

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    image_url: imageUrl,
    is_main: options.isMain ?? false,
    alt_text: options.altText,
    color_id: options.colorId,
  });

  if (error) throw error;
}

/**
 * Delete product image
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw error;
}

/**
 * Add product variant
 */
export async function addProductVariant(
  productId: string,
  variantData: VariantFormData
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      ...variantData,
    })
    .select(`
      *,
      color:colors(id, name, hex_code),
      size:sizes(id, label),
      material:materials(id, name),
      custom_variant:custom_variants(id, label)
    `)
    .single();

  if (error) throw error;

  return data as unknown as ProductVariant;
}

/**
 * Update product variant
 */
export async function updateProductVariant(
  variantId: string,
  variantData: Partial<VariantFormData>
): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .update(variantData)
    .eq("id", variantId);

  if (error) throw error;
}

/**
 * Delete product variant
 */
export async function deleteProductVariant(variantId: string): Promise<void> {
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);

  if (error) throw error;
}

/**
 * Fetch product count
 */
export async function fetchProductCount(): Promise<number> {
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (error) throw error;

  return count || 0;
}
