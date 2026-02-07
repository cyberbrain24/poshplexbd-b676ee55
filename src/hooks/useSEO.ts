import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export interface SEOMetadata {
  id: string;
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keywords: string[] | null;
  og_image: string | null;
  is_dynamic: boolean;
  entity_type: string | null;
  entity_id: string | null;
  canonical_url: string | null;
  no_index: boolean;
  json_ld_type: string | null;
  priority: number | null;
  change_frequency: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all SEO paths for admin
export const useSEOPaths = (search?: string) => {
  return useQuery({
    queryKey: ["seo-paths", search],
    queryFn: async () => {
      let query = supabase
        .from("seo_metadata")
        .select("*")
        .order("page_path", { ascending: true });

      if (search) {
        query = query.or(`page_path.ilike.%${search}%,meta_title.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SEOMetadata[];
    },
    staleTime: 30000,
  });
};

// Fetch SEO for a specific path
export const useSEOByPath = (path: string) => {
  return useQuery({
    queryKey: ["seo-path", path],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_metadata")
        .select("*")
        .eq("page_path", path)
        .maybeSingle();

      if (error) throw error;
      return data as SEOMetadata | null;
    },
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};

// Universal SEO hook - auto-detects current path
export const usePoshplexSEO = () => {
  const location = useLocation();
  const path = location.pathname;

  return useQuery({
    queryKey: ["seo-path", path],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_metadata")
        .select("*")
        .eq("page_path", path)
        .maybeSingle();

      if (error) throw error;
      return data as SEOMetadata | null;
    },
    staleTime: 60000,
    gcTime: 300000,
  });
};

// Mutations for admin
export const useSEOMutations = () => {
  const queryClient = useQueryClient();

  const upsertSEO = useMutation({
    mutationFn: async (seo: Partial<SEOMetadata> & { page_path: string }) => {
      const { data, error } = await supabase
        .from("seo_metadata")
        .upsert(seo, { onConflict: "page_path" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-paths"] });
      queryClient.invalidateQueries({ queryKey: ["seo-path"] });
    },
  });

  const deleteSEO = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("seo_metadata")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-paths"] });
    },
  });

  return { upsertSEO, deleteSEO };
};
