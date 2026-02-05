import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
  category?: BlogCategory;
}

export interface BlogPostProduct {
  post_id: string;
  product_id: string;
  sort_order: number;
}

// Categories Hooks
export const useBlogCategories = () => {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BlogCategory[];
    },
  });
};

export const useCreateBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<BlogCategory, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });
};

export const useUpdateBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to update category"),
  });
};

export const useDeleteBlogCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });
};

// Posts Hooks
export const useBlogPosts = (status?: string) => {
  return useQuery({
    queryKey: ["blog-posts", status],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*, category:blog_categories(*)")
        .order("created_at", { ascending: false });
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BlogPost[];
    },
  });
};

export const useBlogPost = (slug: string) => {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, category:blog_categories(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (post: Omit<BlogPost, "id" | "created_at" | "updated_at" | "category">) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post created");
    },
    onError: () => toast.error("Failed to create post"),
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post updated");
    },
    onError: () => toast.error("Failed to update post"),
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Post deleted");
    },
    onError: () => toast.error("Failed to delete post"),
  });
};

// Post Products (Shop The Look)
export const useBlogPostProducts = (postId: string) => {
  return useQuery({
    queryKey: ["blog-post-products", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_post_products")
        .select("*, product:products(id, name, base_price, sku, images:product_images(image_url, is_main))")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
};

export const useUpdateBlogPostProducts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, productIds }: { postId: string; productIds: string[] }) => {
      // Delete existing links
      await supabase.from("blog_post_products").delete().eq("post_id", postId);
      
      // Insert new links
      if (productIds.length > 0) {
        const inserts = productIds.map((productId, index) => ({
          post_id: postId,
          product_id: productId,
          sort_order: index,
        }));
        const { error } = await supabase.from("blog_post_products").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["blog-post-products", variables.postId] });
    },
  });
};

// AI Generation Hook
export const useAiGenerate = () => {
  return useMutation({
    mutationFn: async (payload: {
      type: 'product_description' | 'blog_content' | 'meta_tags' | 'blog_excerpt';
      context: Record<string, string | undefined>;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-seo-generate', {
        body: payload,
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.result;
    },
  });
};
