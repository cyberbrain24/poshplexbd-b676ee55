import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductFormData, ProductImage, ProductVariant, VariantFormData } from "@/types/product";

const pathFromPublicUrl = (url: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
};

export const useProductsList = (limit?: number) => {
  return useQuery({
    queryKey: ["products-list", limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id, name, sku, product_type, base_price, is_active, created_at,
          category:categories(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false });
      query = query.limit(Math.min(limit || 100, 100));
      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useProductCount = () => {
  return useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          size_guide:size_guides(*),
          images:product_images(*),
          variants:product_variants(
            *,
            color:colors(*),
            size:sizes(*)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useProduct = (slugOrId: string | undefined) => {
  return useQuery({
    queryKey: ["product", slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const isFullUuid = uuidRegex.test(slugOrId);
      const parts = slugOrId.split('-');
      const shortId = parts[parts.length - 1];

      const selectQuery = `
        *,
        category:categories(*),
        size_guide:size_guides(*),
        images:product_images(*, color:colors(*)),
        variants:product_variants(
          *,
          color:colors(*),
          size:sizes(*)
        )
      `;

      let data, error;
      if (isFullUuid) {
        const result = await supabase.from("products").select(selectQuery).eq("id", slugOrId).single();
        data = result.data; error = result.error;
      } else if (shortId && /^[0-9a-f]{8}$/i.test(shortId)) {
        const { data: fullId, error: rpcError } = await supabase.rpc("find_product_by_short_id", { short_id: shortId });
        if (rpcError || !fullId) throw { message: "Product not found", code: "PGRST116" };
        const result = await supabase.from("products").select(selectQuery).eq("id", fullId).single();
        data = result.data; error = result.error;
      } else {
        return null;
      }
      if (error) throw error;
      return data as Product;
    },
    enabled: !!slugOrId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: ProductFormData) => {
      const generatedSku = `SKU-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
      const { data, error } = await supabase.from("products").insert({
        name: p.name,
        sku: p.sku?.trim() || generatedSku,
        product_type: p.product_type,
        category_id: p.category_id || null,
        short_description: p.short_description || null,
        full_description: p.full_description || null,
        base_price: p.base_price,
        youtube_url: p.youtube_url || null,
        youtube_autoplay: p.youtube_autoplay,
        youtube_mute: p.youtube_mute,
        size_guide_id: p.size_guide_id || null,
        is_active: p.is_active,
        is_featured: p.is_featured,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["products-count"] });
      qc.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: p }: { id: string; data: Partial<ProductFormData> }) => {
      const { data, error } = await supabase.from("products").update({
        name: p.name,
        sku: p.sku?.trim() || undefined,
        product_type: p.product_type,
        category_id: p.category_id || null,
        short_description: p.short_description || null,
        full_description: p.full_description || null,
        base_price: p.base_price,
        youtube_url: p.youtube_url || null,
        youtube_autoplay: p.youtube_autoplay,
        youtube_mute: p.youtube_mute,
        size_guide_id: p.size_guide_id || null,
        is_active: p.is_active,
        is_featured: p.is_featured,
      }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["product", updated.id] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["products-optimized"] });
      qc.invalidateQueries({ queryKey: ["category-products-optimized"] });
      qc.invalidateQueries({ queryKey: ["featured-products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: productImages } = await supabase
        .from("product_images")
        .select("image_url, thumb_url, medium_url, large_url")
        .eq("product_id", id);

      const imagePaths = (productImages ?? [])
        .flatMap((img: any) => [img.image_url, img.thumb_url, img.medium_url, img.large_url])
        .filter(Boolean)
        .map((url) => pathFromPublicUrl(url as string, "product-images"))
        .filter(Boolean) as string[];
      if (imagePaths.length > 0) {
        await supabase.storage.from("product-images").remove([...new Set(imagePaths)]);
      }

      await supabase.from("product_images").delete().eq("product_id", id);
      await supabase.from("product_variants").delete().eq("product_id", id);
      await supabase.from("order_items").update({ product_id: null, variant_id: null }).eq("product_id", id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["products-count"] });
      qc.invalidateQueries({ queryKey: ["category-products-optimized"] });
    },
  });
};

export const useAddProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId, imageUrl, thumbUrl, mediumUrl, largeUrl, altText, sortOrder, isMain, colorId,
    }: {
      productId: string; imageUrl: string;
      thumbUrl?: string | null; mediumUrl?: string | null; largeUrl?: string | null;
      altText?: string; sortOrder?: number; isMain?: boolean; colorId?: string;
    }) => {
      const { data, error } = await supabase.from("product_images").insert({
        product_id: productId, image_url: imageUrl,
        thumb_url: thumbUrl ?? null, medium_url: mediumUrl ?? null, large_url: largeUrl ?? null,
        alt_text: altText || null, sort_order: sortOrder || 0,
        is_main: isMain || false, color_id: colorId || null,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useUpdateProductImage = () => {
  const qc = useQueryClient();
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
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProductImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: image } = await supabase
        .from("product_images")
        .select("image_url, thumb_url, medium_url, large_url")
        .eq("id", id).single();

      const paths = [(image as any)?.image_url, (image as any)?.thumb_url, (image as any)?.medium_url, (image as any)?.large_url]
        .filter(Boolean)
        .map((url) => pathFromPublicUrl(url as string, "product-images"))
        .filter(Boolean) as string[];
      if (paths.length > 0) {
        await supabase.storage.from("product-images").remove([...new Set(paths)]);
      }
      const { error } = await supabase.from("product_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useAddProductVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, variantData }: { productId: string; variantData: VariantFormData }) => {
      const { data, error } = await supabase.from("product_variants").insert({
        product_id: productId,
        color_id: variantData.color_id || null,
        size_id: variantData.size_id || null,
        sku: variantData.sku || undefined,
        purchase_price: variantData.purchase_price,
        selling_price: variantData.selling_price,
        is_active: variantData.is_active,
        image_url: variantData.image_url || null,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useUpdateProductVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data: v }: { id: string; data: Partial<VariantFormData> }) => {
      const updates: Record<string, any> = {};
      if (v.color_id !== undefined) updates.color_id = v.color_id || null;
      if (v.size_id !== undefined) updates.size_id = v.size_id || null;
      if (v.sku !== undefined) updates.sku = v.sku || undefined;
      if (v.purchase_price !== undefined) updates.purchase_price = v.purchase_price;
      if (v.selling_price !== undefined) updates.selling_price = v.selling_price;
      if (v.is_active !== undefined) updates.is_active = v.is_active;
      if (v.image_url !== undefined) updates.image_url = v.image_url;
      const { data, error } = await supabase.from("product_variants").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useDeleteProductVariant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-list"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

const slugifyName = (name: string) =>
  name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "product";

export const uploadProductImage = async (file: File, productId: string): Promise<{
  url: string; thumb_url: string | null; medium_url: string | null; large_url: string | null;
}> => {
  const { toWebpUnder250 } = await import("@/lib/imageToWebp");
  const webpFile = await toWebpUnder250(file);
  const ts = Date.now();

  // Name files after the product, numbered per image (product-name-1, -2, ...)
  const { data: productRow } = await supabase.from("products").select("name").eq("id", productId).maybeSingle();
  const slug = slugifyName((productRow as any)?.name || "product");
  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  const baseName = `${slug}-${(count || 0) + 1}`;

  const ext = webpFile.type === "image/webp" ? "webp" : (file.name.split(".").pop()?.toLowerCase() || "webp");
  let fileName = `${productId}/${baseName}.${ext}`;

  let { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(fileName, webpFile, { contentType: webpFile.type, cacheControl: "31536000" });
  if (uploadError) {
    // Name already taken (parallel upload) — fall back to a unique variant
    fileName = `${productId}/${baseName}-${ts}.${ext}`;
    const retry = await supabase.storage
      .from("product-images")
      .upload(fileName, webpFile, { contentType: webpFile.type, cacheControl: "31536000" });
    uploadError = retry.error;
  }
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
  const url = data.publicUrl;
  file = webpFile;


  let thumb_url: string | null = null, medium_url: string | null = null, large_url: string | null = null;
  try {
    const { generateImageVariants } = await import("@/lib/imageThumbs");
    const variants = await generateImageVariants(file);
    const tasks: Promise<void>[] = [];
    const buildTask = (f: File | null, folder: string, width: number, assign: (u: string) => void) => {
      if (!f) return;
      const path = `${productId}/${folder}/${fileName.split("/").pop()!.replace(/\.[^.]+$/, "")}-${width}.webp`;
      tasks.push(
        supabase.storage.from("product-images").upload(path, f, { contentType: "image/webp", cacheControl: "31536000" })
          .then(({ error }) => { if (!error) assign(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl); })
      );
    };
    buildTask(variants.small, "thumbs", 150, (u) => { thumb_url = u; });
    buildTask(variants.medium, "medium", 300, (u) => { medium_url = u; });
    buildTask(variants.large, "large", 450, (u) => { large_url = u; });
    await Promise.all(tasks);
  } catch (err) {
    console.warn("Variant generation failed:", err);
  }

  return { url, thumb_url, medium_url, large_url };
};

// ---- Featured products management ----

export const useFeaturedProductsAdmin = () => {
  return useQuery({
    queryKey: ["featured-products-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, sku, base_price, is_active, is_featured, featured_sort_order,
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .eq("is_featured", true)
        .order("featured_sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Product[];
    },
    staleTime: 1000 * 30,
  });
};

const invalidateFeatured = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["featured-products"] });
  qc.invalidateQueries({ queryKey: ["featured-products-admin"] });
  qc.invalidateQueries({ queryKey: ["products-optimized"] });
  qc.invalidateQueries({ queryKey: ["products"] });
};

export const useToggleFeatured = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      let nextOrder = 0;
      if (value) {
        const { data: maxRow } = await supabase
          .from("products")
          .select("featured_sort_order")
          .eq("is_featured", true)
          .order("featured_sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        nextOrder = ((maxRow as any)?.featured_sort_order ?? 0) + 1;
      }
      const { error } = await supabase
        .from("products")
        .update({ is_featured: value, featured_sort_order: nextOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateFeatured(qc),
  });
};

export const useSaveFeaturedOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from("products")
          .update({ featured_sort_order: i + 1 })
          .eq("id", orderedIds[i]);
        if (error) throw error;
      }
    },
    onSuccess: () => invalidateFeatured(qc),
  });
};
