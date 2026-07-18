import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductFormData, ProductImage, ProductVariant, VariantFormData } from "@/types/product";

const pathFromPublicUrl = (url: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
};

// Lightweight product list query - for admin list and category pages
// NOTE: Supabase has a 1000 row default limit. For >1000 products, use useOptimizedProducts
export const useProductsList = (limit?: number) => {
  return useQuery({
    queryKey: ["products-list", limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          product_type,
          base_price,
          is_active,
          created_at,
          category:categories(id, name),
          brand:brands(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false });
      
      // Apply limit with hard cap of 100
      query = query.limit(Math.min(limit || 100, 100));

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes (formerly cacheTime)
  });
};

// Get total product count (for display purposes)
export const useProductCount = () => {
  return useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 2,
  });
};

// Full product query with all relations - for product detail page and modal
export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          brand:brands(*),
          size_guide:size_guides(*),
          care_instruction:care_instructions(*),
          images:product_images(*),
          variants:product_variants(
            *,
            color:colors(*),
            size:sizes(*),
            material:materials(*)


          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - don't refetch if data is fresh
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useProduct = (slugOrId: string | undefined) => {
  return useQuery({
    queryKey: ["product", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      
      // Check if it's a full UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isFullUuid = uuidRegex.test(slugOrId);
      
      // Extract short ID from slug if not a full UUID
      const parts = slugOrId.split('-');
      const shortId = parts[parts.length - 1];
      
      const selectQuery = `
        *,
        category:categories(*),
        brand:brands(*),
        size_guide:size_guides(*),
        care_instruction:care_instructions(*),
        images:product_images(*, color:colors(*)),
        variants:product_variants(
          *,
          color:colors(*),
          size:sizes(*),
          material:materials(*)
          
        )
      `;
      
      let data, error;
      
      if (isFullUuid) {
        // Match by full ID
        const result = await supabase
          .from("products")
          .select(selectQuery)
          .eq("id", slugOrId)
          .single();
        data = result.data;
        error = result.error;
      } else if (shortId && /^[0-9a-f]{8}$/i.test(shortId)) {
        // Use DB function to resolve short ID to full UUID
        const { data: fullId, error: rpcError } = await supabase
          .rpc("find_product_by_short_id", { short_id: shortId });
        
        if (rpcError || !fullId) {
          throw { message: "Product not found", code: "PGRST116" };
        }

        const result = await supabase
          .from("products")
          .select(selectQuery)
          .eq("id", fullId)
          .single();
        data = result.data;
        error = result.error;
      } else {
        return null;
      }

      if (error) throw error;
      return data as Product;
    },
    enabled: !!slugOrId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          name: productData.name,
          sku: productData.sku || undefined,
          product_type: productData.product_type,
          category_id: productData.category_id || null,
          brand_id: productData.brand_id || null,
          short_description: productData.short_description || null,
          full_description: productData.full_description || null,
          base_price: productData.base_price,
          youtube_url: productData.youtube_url || null,
          youtube_autoplay: productData.youtube_autoplay,
          youtube_mute: productData.youtube_mute,
          size_guide_id: productData.size_guide_id || null,
          care_instruction_id: productData.care_instruction_id || null,
          is_active: productData.is_active,
          is_featured: productData.is_featured,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      queryClient.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: productData }: { id: string; data: Partial<ProductFormData> }) => {
      const { data, error } = await supabase
        .from("products")
        .update({
          name: productData.name,
          sku: productData.sku || undefined,
          product_type: productData.product_type,
          category_id: productData.category_id || null,
          brand_id: productData.brand_id || null,
          short_description: productData.short_description || null,
          full_description: productData.full_description || null,
          base_price: productData.base_price,
          youtube_url: productData.youtube_url || null,
          youtube_autoplay: productData.youtube_autoplay,
          youtube_mute: productData.youtube_mute,
          size_guide_id: productData.size_guide_id || null,
          care_instruction_id: productData.care_instruction_id || null,
          is_active: productData.is_active,
          is_featured: productData.is_featured,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProduct) => {
      queryClient.invalidateQueries({ queryKey: ["product", updatedProduct.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products-optimized"] });
      queryClient.invalidateQueries({ queryKey: ["category-products-optimized"] });
      queryClient.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Manual cascade deletion: delete related records first
      // 1. Delete product image storage files, including thumbnails/medium variants
      const { data: productImages, error: imageFetchError } = await supabase
        .from("product_images")
        .select("image_url, thumb_url, medium_url, large_url")
        .eq("product_id", id);
      if (imageFetchError) throw imageFetchError;

      const imagePaths = (productImages ?? [])
        .flatMap((img: any) => [img.image_url, img.thumb_url, img.medium_url, img.large_url])
        .filter(Boolean)
        .map((url) => pathFromPublicUrl(url as string, "product-images"))
        .filter(Boolean) as string[];
      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove([...new Set(imagePaths)]);
        if (storageError) throw storageError;
      }

      // 2. Delete product images
      const { error: imagesError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id);
      if (imagesError) throw imagesError;

      // 3. Delete product variants
      const { error: variantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);
      if (variantsError) throw variantsError;

      // 4. Nullify order_items product references (preserve order history)
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .update({ product_id: null, variant_id: null })
        .eq("product_id", id);
      if (orderItemsError) throw orderItemsError;

      // 5. Delete the product
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["products-count"] });
      queryClient.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};

// Product Images
export const useAddProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      imageUrl,
      thumbUrl,
      mediumUrl,
      largeUrl,
      altText,
      sortOrder,
      isMain,
      colorId,
    }: {
      productId: string;
      imageUrl: string;
      thumbUrl?: string | null;
      mediumUrl?: string | null;
      largeUrl?: string | null;
      altText?: string;
      sortOrder?: number;
      isMain?: boolean;
      colorId?: string;
    }) => {
      const { data, error } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl,
          thumb_url: thumbUrl ?? null,
          medium_url: mediumUrl ?? null,
          large_url: largeUrl ?? null,
          alt_text: altText || null,
          sort_order: sortOrder || 0,
          is_main: isMain || false,
          color_id: colorId || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useUpdateProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, colorId, isMain, sortOrder }: { id: string; colorId?: string | null; isMain?: boolean; sortOrder?: number }) => {
      const updates: Record<string, any> = {};
      if (colorId !== undefined) updates.color_id = colorId;
      if (isMain !== undefined) updates.is_main = isMain;
      if (sortOrder !== undefined) updates.sort_order = sortOrder;
      if (Object.keys(updates).length === 0) return;
      const { error } = await supabase.from("product_images").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: image, error: fetchError } = await supabase
        .from("product_images")
        .select("image_url, thumb_url, medium_url, large_url")
        .eq("id", id)
        .single();
      if (fetchError) throw fetchError;

      const paths = [
        (image as any)?.image_url,
        (image as any)?.thumb_url,
        (image as any)?.medium_url,
        (image as any)?.large_url,
      ]
        .filter(Boolean)
        .map((url) => pathFromPublicUrl(url as string, "product-images"))
        .filter(Boolean) as string[];
      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("product-images")
          .remove([...new Set(paths)]);
        if (storageError) throw storageError;
      }

      const { error } = await supabase.from("product_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

// Product Variants
export const useAddProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      variantData,
    }: {
      productId: string;
      variantData: VariantFormData;
    }) => {
      const { data, error } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          color_id: variantData.color_id || null,
          size_id: variantData.size_id || null,
          material_id: variantData.material_id || null,
          
          sku: variantData.sku || undefined,
          purchase_price: variantData.purchase_price,
          selling_price: variantData.selling_price,
          is_active: variantData.is_active,
          image_url: variantData.image_url || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: variantData }: { id: string; data: Partial<VariantFormData> }) => {
      const updates: Record<string, any> = {};
      if (variantData.color_id !== undefined) updates.color_id = variantData.color_id || null;
      if (variantData.size_id !== undefined) updates.size_id = variantData.size_id || null;
      if (variantData.material_id !== undefined) updates.material_id = variantData.material_id || null;
      
      if (variantData.sku !== undefined) updates.sku = variantData.sku || undefined;
      if (variantData.purchase_price !== undefined) updates.purchase_price = variantData.purchase_price;
      if (variantData.selling_price !== undefined) updates.selling_price = variantData.selling_price;
      if (variantData.is_active !== undefined) updates.is_active = variantData.is_active;
      if (variantData.image_url !== undefined) updates.image_url = variantData.image_url;

      const { data, error } = await supabase
        .from("product_variants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

// Upload product image to storage along with three pre-rendered WebP
// thumbnails (150 / 300 / 450 px). Each derived variant is generated FROM the
// main image so SEO metadata + deletion stay anchored to it. Falls back
// gracefully when variants can't be produced.
export const uploadProductImage = async (
  file: File,
  productId: string,
): Promise<{
  url: string;
  thumb_url: string | null;
  medium_url: string | null;
  large_url: string | null;
}> => {
  const { toWebpUnder250 } = await import("@/lib/imageToWebp");
  const webpFile = await toWebpUnder250(file);

  const ts = Date.now();
  const ext = webpFile.type === "image/webp" ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "webp");
  const fileName = `${productId}/${ts}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, webpFile, { contentType: webpFile.type });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  const url = data.publicUrl;
  // Use the converted file for variant generation too
  file = webpFile;

  // Generate + upload three derived variants in parallel; never let variant
  // failures block the main upload. Each derived file lives under a
  // bucket-prefix that the resolver recognises so they stay tied to the main.
  let thumb_url: string | null = null;
  let medium_url: string | null = null;
  let large_url: string | null = null;
  try {
    const { generateImageVariants } = await import("@/lib/imageThumbs");
    const variants = await generateImageVariants(file);

    const tasks: Promise<void>[] = [];
    const buildTask = (
      file: File | null,
      folder: string,
      width: number,
      assign: (u: string) => void,
    ) => {
      if (!file) return;
      const path = `${productId}/${folder}/${ts}-${width}.webp`;
      tasks.push(
        supabase.storage
          .from("product-images")
          .upload(path, file, { contentType: "image/webp" })
          .then(({ error }) => {
            if (!error) {
              assign(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
            }
          }),
      );
    };
    buildTask(variants.small, "thumbs", 150, (u) => { thumb_url = u; });
    buildTask(variants.medium, "medium", 300, (u) => { medium_url = u; });
    buildTask(variants.large, "large", 450, (u) => { large_url = u; });
    await Promise.all(tasks);
  } catch (err) {
    console.warn("Variant generation failed, original will be used:", err);
  }

  return { url, thumb_url, medium_url, large_url };
};

