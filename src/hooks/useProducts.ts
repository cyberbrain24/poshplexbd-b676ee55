import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductFormData, ProductImage, ProductVariant, VariantFormData } from "@/types/product";

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
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Manual cascade deletion: delete related records first
      // 1. Delete product images
      const { error: imagesError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", id);
      if (imagesError) throw imagesError;

      // 2. Delete product variants
      const { error: variantsError } = await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", id);
      if (variantsError) throw variantsError;

      // 3. Nullify order_items product references (preserve order history)
      const { error: orderItemsError } = await supabase
        .from("order_items")
        .update({ product_id: null, variant_id: null })
        .eq("product_id", id);
      if (orderItemsError) throw orderItemsError;

      // 4. Delete the product
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
      altText,
      sortOrder,
      isMain,
      colorId,
    }: {
      productId: string;
      imageUrl: string;
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
          alt_text: altText || null,
          sort_order: sortOrder || 0,
          is_main: isMain || false,
          color_id: colorId || null,
        })
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
    mutationFn: async ({ id, colorId, isMain }: { id: string; colorId?: string | null; isMain?: boolean }) => {
      const updates: Record<string, any> = {};
      if (colorId !== undefined) updates.color_id = colorId;
      if (isMain !== undefined) updates.is_main = isMain;
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
        })
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

// Upload product image to storage
export const uploadProductImage = async (file: File, productId: string): Promise<string> => {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }

  // Validate productId format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    throw new Error('Invalid product ID format.');
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  if (!fileExt || !allowedExts.includes(fileExt)) {
    throw new Error('Invalid file extension.');
  }

  const fileName = `${productId}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  return data.publicUrl;
};
