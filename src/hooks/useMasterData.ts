import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Color, Size, Material, SizeGuide, CareInstruction, Category, Brand, CustomVariant } from "@/types/product";

// Cache configuration for master data - these rarely change
const MASTER_DATA_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const MASTER_DATA_GC_TIME = 1000 * 60 * 10; // 10 minutes

// Colors
export const useColors = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colors")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Color[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (colorData: { name: string; hex_code: string }) => {
      const { data, error } = await supabase
        .from("colors")
        .insert(colorData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
};

export const useUpdateColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; hex_code: string } }) => {
      const { data: result, error } = await supabase
        .from("colors")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
};

export const useDeleteColor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["colors"] }),
  });
};

// Sizes
export const useSizes = () => {
  return useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sizes")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Size[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateSize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sizeData: { label: string; fit_type?: string; sort_order?: number }) => {
      const { data, error } = await supabase
        .from("sizes")
        .insert(sizeData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

export const useUpdateSize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { label: string; fit_type?: string; sort_order?: number } }) => {
      const { data: result, error } = await supabase
        .from("sizes")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

export const useDeleteSize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sizes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

// Custom Variants
export const useCustomVariants = () => {
  return useQuery({
    queryKey: ["customVariants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_variants" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as CustomVariant[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateCustomVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { label: string; sort_order?: number; is_active?: boolean }) => {
      const { data: result, error } = await supabase
        .from("custom_variants" as any)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customVariants"] }),
  });
};

export const useUpdateCustomVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { label?: string; sort_order?: number; is_active?: boolean } }) => {
      const { data: result, error } = await supabase
        .from("custom_variants" as any)
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customVariants"] }),
  });
};

export const useDeleteCustomVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_variants" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customVariants"] }),
  });
};

// Materials
export const useMaterials = () => {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Material[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (materialData: { name: string; gsm?: string; season?: string }) => {
      const { data, error } = await supabase
        .from("materials")
        .insert(materialData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; gsm?: string; season?: string } }) => {
      const { data: result, error } = await supabase
        .from("materials")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["materials"] }),
  });
};

// Size Guides
export const useSizeGuides = () => {
  return useQuery({
    queryKey: ["sizeGuides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("size_guides")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as SizeGuide[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateSizeGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guideData: { name: string; content: string }) => {
      const { data, error } = await supabase
        .from("size_guides")
        .insert(guideData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

export const useUpdateSizeGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; content: string } }) => {
      const { data: result, error } = await supabase
        .from("size_guides")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

export const useDeleteSizeGuide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("size_guides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

// Care Instructions
export const useCareInstructions = () => {
  return useQuery({
    queryKey: ["careInstructions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_instructions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as CareInstruction[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateCareInstruction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (careData: { name: string; content: string }) => {
      const { data, error } = await supabase
        .from("care_instructions")
        .insert(careData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careInstructions"] }),
  });
};

export const useUpdateCareInstruction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; content: string } }) => {
      const { data: result, error } = await supabase
        .from("care_instructions")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careInstructions"] }),
  });
};

export const useDeleteCareInstruction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("care_instructions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careInstructions"] }),
  });
};

// Categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryData: { name: string; parent_id?: string; image_url?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(categoryData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; parent_id?: string | null; image_url?: string | null; is_active?: boolean } }) => {
      const { data: result, error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useReorderCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("categories")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });
};

// Brands
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Brand[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brandData: { name: string }) => {
      const { data, error } = await supabase
        .from("brands")
        .insert(brandData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string } }) => {
      const { data: result, error } = await supabase
        .from("brands")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });
};
