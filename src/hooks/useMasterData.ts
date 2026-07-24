import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Color, Size, SizeGuide, Category } from "@/types/product";

const MASTER_DATA_STALE_TIME = 1000 * 60 * 5;
const MASTER_DATA_GC_TIME = 1000 * 60 * 10;

// Colors
export const useColors = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["colors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colors").select("*").order("name");
      if (error) throw error;
      return data as Color[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateColor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (colorData: { name: string; hex_code: string }) => {
      const { data, error } = await supabase.from("colors").insert(colorData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colors"] }),
  });
};

export const useUpdateColor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; hex_code: string } }) => {
      const { data: r, error } = await supabase.from("colors").update(data).eq("id", id).select().single();
      if (error) throw error;
      return r;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colors"] }),
  });
};

export const useDeleteColor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("colors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["colors"] }),
  });
};

// Sizes
export const useSizes = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["sizes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sizes").select("*").order("sort_order");
      if (error) throw error;
      return data as Size[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
    enabled: options?.enabled ?? true,
  });
};

export const useCreateSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sizeData: { label: string; fit_type?: string; sort_order?: number }) => {
      const { data, error } = await supabase.from("sizes").insert(sizeData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

export const useUpdateSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { label: string; fit_type?: string; sort_order?: number } }) => {
      const { data: r, error } = await supabase.from("sizes").update(data).eq("id", id).select().single();
      if (error) throw error;
      return r;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

export const useDeleteSize = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sizes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizes"] }),
  });
};

// Size Guides
export const useSizeGuides = () => {
  return useQuery({
    queryKey: ["sizeGuides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("size_guides").select("*").order("name");
      if (error) throw error;
      return data as SizeGuide[];
    },
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
  });
};

export const useCreateSizeGuide = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guideData: { name: string; content: string }) => {
      const { data, error } = await supabase.from("size_guides").insert(guideData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

export const useUpdateSizeGuide = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; content: string } }) => {
      const { data: r, error } = await supabase.from("size_guides").update(data).eq("id", id).select().single();
      if (error) throw error;
      return r;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

export const useDeleteSizeGuide = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("size_guides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sizeGuides"] }),
  });
};

// Categories
const CATEGORIES_CACHE_KEY = "pp_categories_v1";
const CATEGORIES_CACHE_TTL = 60 * 60 * 1000; // 1h

function readCategoriesCache(): Category[] | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CATEGORIES_CACHE_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CATEGORIES_CACHE_TTL) return null;
    return parsed.data as Category[];
  } catch { return null; }
}

function writeCategoriesCache(data: Category[]) {
  try { localStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { /* noop */ }
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      // 1) Consume the early HTML preload if present — removes the JS→data waterfall
      const pre = (typeof window !== "undefined" && (window as any).__ppPreload?.categories) as Promise<any> | undefined;
      if (pre) {
        const arr = await pre;
        if (Array.isArray(arr)) { writeCategoriesCache(arr as Category[]); return arr as Category[]; }
      }
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      writeCategoriesCache((data || []) as Category[]);
      return data as Category[];
    },
    initialData: () => readCategoriesCache() ?? undefined,
    staleTime: MASTER_DATA_STALE_TIME,
    gcTime: MASTER_DATA_GC_TIME,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};


export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryData: { name: string; parent_id?: string; image_url?: string; is_active?: boolean }) => {
      const { data, error } = await supabase.from("categories").insert(categoryData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; parent_id?: string | null; image_url?: string | null; is_active?: boolean } }) => {
      const { data: r, error } = await supabase.from("categories").update(data).eq("id", id).select().single();
      if (error) throw error;
      return r;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};

export const useReorderCategories = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase.from("categories").update({ sort_order: u.sort_order }).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
};
