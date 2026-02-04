import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Color, Size, Material, SizeGuide, CareInstruction, Category, Brand } from "@/types/product";

// Colors
export const useColors = () => {
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
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryData: { name: string; parent_id?: string }) => {
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
    mutationFn: async ({ id, data }: { id: string; data: { name: string; parent_id?: string } }) => {
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
