import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchBlogPosts,
  fetchPublishedPosts,
  fetchBlogPostBySlug,
  fetchBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  setBlogPostStatus,
  fetchBlogCategories,
  fetchActiveBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  ListPostsParams,
} from "@/services/blog.service";
import { BlogPostInput, BlogCategory, BlogPostStatus } from "@/types/blog";

export const useBlogPosts = (params: ListPostsParams = {}) =>
  useQuery({
    queryKey: ["blog-posts", params],
    queryFn: () => fetchBlogPosts(params),
  });

export const usePublishedPosts = (params: { limit?: number; offset?: number; categorySlug?: string } = {}) =>
  useQuery({
    queryKey: ["blog-posts-published", params],
    queryFn: () => fetchPublishedPosts(params),
  });

export const useBlogPostBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: ["blog-post-slug", slug],
    queryFn: () => fetchBlogPostBySlug(slug!),
    enabled: !!slug,
  });

export const useBlogPostById = (id: string | undefined) =>
  useQuery({
    queryKey: ["blog-post-id", id],
    queryFn: () => fetchBlogPostById(id!),
    enabled: !!id,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["blog-posts"] });
  qc.invalidateQueries({ queryKey: ["blog-posts-published"] });
  qc.invalidateQueries({ queryKey: ["blog-post-slug"] });
  qc.invalidateQueries({ queryKey: ["blog-post-id"] });
};

export const useCreateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlogPostInput) => createBlogPost(input),
    onSuccess: () => { invalidateAll(qc); toast.success("Post created"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BlogPostInput> }) => updateBlogPost(id, input),
    onSuccess: () => { invalidateAll(qc); toast.success("Post updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteBlogPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogPost(id),
    onSuccess: () => { invalidateAll(qc); toast.success("Post deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSetBlogPostStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogPostStatus }) => setBlogPostStatus(id, status),
    onSuccess: () => { invalidateAll(qc); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
};

// Categories
export const useBlogCategories = () =>
  useQuery({ queryKey: ["blog-categories"], queryFn: fetchBlogCategories });

export const useActiveBlogCategories = () =>
  useQuery({ queryKey: ["blog-categories-active"], queryFn: fetchActiveBlogCategories });

export const useCreateBlogCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<BlogCategory> & { name: string }) => createBlogCategory(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      qc.invalidateQueries({ queryKey: ["blog-categories-active"] });
      toast.success("Category created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateBlogCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BlogCategory> }) => updateBlogCategory(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      qc.invalidateQueries({ queryKey: ["blog-categories-active"] });
      toast.success("Category updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteBlogCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlogCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-categories"] });
      qc.invalidateQueries({ queryKey: ["blog-categories-active"] });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
