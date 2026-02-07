import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  status: "draft" | "published" | "archived";
  page_type: "system" | "custom";
  is_protected: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// Fetch all pages for admin
export const usePages = (search?: string) => {
  return useQuery({
    queryKey: ["pages", search],
    queryFn: async () => {
      let query = supabase
        .from("pages")
        .select("*")
        .order("sort_order", { ascending: true });

      if (search) {
        query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Page[];
    },
    staleTime: 30000,
  });
};

// Fetch published pages only (for menus)
export const usePublishedPages = () => {
  return useQuery({
    queryKey: ["pages", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug, page_type")
        .eq("status", "published")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as Pick<Page, "id" | "title" | "slug" | "page_type">[];
    },
    staleTime: 60000,
  });
};

// Fetch single page by slug (for dynamic routing)
export const usePageBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (error) throw error;
      return data as Page | null;
    },
    staleTime: 60000,
    gcTime: 300000,
    enabled: !!slug,
  });
};

// Generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Mutations
export const usePageMutations = () => {
  const queryClient = useQueryClient();

  const createPage = useMutation({
    mutationFn: async (page: Omit<Page, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("pages")
        .insert({
          ...page,
          published_at: page.status === "published" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["seo-paths"] });
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Page> & { id: string }) => {
      // Set published_at when transitioning to published
      const updateData: Record<string, unknown> = { ...updates };
      if (updates.status === "published") {
        const { data: existing } = await supabase
          .from("pages")
          .select("published_at")
          .eq("id", id)
          .single();
        
        if (!existing?.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from("pages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["page"] });
      queryClient.invalidateQueries({ queryKey: ["seo-paths"] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      queryClient.invalidateQueries({ queryKey: ["seo-paths"] });
    },
  });

  return { createPage, updatePage, deletePage };
};
