import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductFormData, ProductImage, ProductVariant, VariantFormData } from "@/types/product";

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
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useProduct = (id: string | undefined) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("products")
        .select(`
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
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
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
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
          stock: variantData.stock,
          is_active: variantData.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: variantData }: { id: string; data: Partial<VariantFormData> }) => {
      const { data, error } = await supabase
        .from("product_variants")
        .update({
          color_id: variantData.color_id || null,
          size_id: variantData.size_id || null,
          material_id: variantData.material_id || null,
          sku: variantData.sku || undefined,
          purchase_price: variantData.purchase_price,
          selling_price: variantData.selling_price,
          stock: variantData.stock,
          is_active: variantData.is_active,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
