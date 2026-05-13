import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogCategory, BlogPostInput, BlogPostStatus } from "@/types/blog";
function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

const POST_COLS = "id, title, slug, excerpt, cover_image_url, cover_image_alt, status, published_at, author_name, reading_time_minutes, view_count, focus_keyword, meta_title, meta_description, canonical_url, og_image_url, robots_index, created_at, updated_at";
const POST_FULL_COLS = `${POST_COLS}, content`;

// Estimate reading time from HTML content (~200 wpm)
export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || `post-${Date.now()}`;
  let i = 1;
  while (true) {
    let q = supabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    if (!data || data.length === 0) return slug;
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
}

// ---------- Categories ----------
export async function fetchBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name");
  if (error) throw error;
  return (data || []) as BlogCategory[];
}

export async function fetchActiveBlogCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");
  if (error) throw error;
  return (data || []) as BlogCategory[];
}

export async function createBlogCategory(input: Partial<BlogCategory> & { name: string }): Promise<BlogCategory> {
  const slug = input.slug || (await ensureUniqueCategorySlug(input.name));
  const { data, error } = await supabase
    .from("blog_categories")
    .insert({
      name: input.name,
      slug,
      description: input.description ?? null,
      sort_order: input.sort_order ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as BlogCategory;
}

export async function updateBlogCategory(id: string, patch: Partial<BlogCategory>): Promise<BlogCategory> {
  const { data, error } = await supabase
    .from("blog_categories")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BlogCategory;
}

export async function deleteBlogCategory(id: string): Promise<void> {
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);
  if (error) throw error;
}

async function ensureUniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  let slug = slugify(name) || `category-${Date.now()}`;
  let i = 1;
  while (true) {
    let q = supabase.from("blog_categories").select("id").eq("slug", slug).limit(1);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    if (!data || data.length === 0) return slug;
    i += 1;
    slug = `${slugify(name)}-${i}`;
  }
}

// ---------- Posts ----------
export interface ListPostsParams {
  status?: BlogPostStatus | "all";
  search?: string;
  categorySlug?: string;
  limit?: number;
  offset?: number;
}

export async function fetchBlogPosts(params: ListPostsParams = {}): Promise<{ posts: BlogPost[]; total: number }> {
  const { status, search, categorySlug, limit = 20, offset = 0 } = params;

  let postIds: string[] | null = null;
  if (categorySlug) {
    const { data: cat } = await supabase.from("blog_categories").select("id").eq("slug", categorySlug).maybeSingle();
    if (!cat) return { posts: [], total: 0 };
    const { data: links } = await supabase.from("blog_post_categories").select("post_id").eq("category_id", cat.id);
    postIds = (links || []).map((l: any) => l.post_id);
    if (postIds.length === 0) return { posts: [], total: 0 };
  }

  let q = supabase.from("blog_posts").select(POST_COLS, { count: "exact" });
  if (status && status !== "all") q = q.eq("status", status);
  if (search) q = q.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
  if (postIds) q = q.in("id", postIds);
  q = q.order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  return { posts: (data || []) as BlogPost[], total: count || 0 };
}

export async function fetchPublishedPosts(params: { limit?: number; offset?: number; categorySlug?: string } = {}): Promise<{ posts: BlogPost[]; total: number }> {
  return fetchBlogPosts({ status: "published", ...params });
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_FULL_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: links } = await supabase
    .from("blog_post_categories")
    .select("category:blog_categories(*)")
    .eq("post_id", data.id);
  const categories = (links || []).map((l: any) => l.category).filter(Boolean) as BlogCategory[];
  return { ...(data as any), categories } as BlogPost;
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(POST_FULL_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: links } = await supabase
    .from("blog_post_categories")
    .select("category:blog_categories(*)")
    .eq("post_id", id);
  const categories = (links || []).map((l: any) => l.category).filter(Boolean) as BlogCategory[];
  return { ...(data as any), categories } as BlogPost;
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPost> {
  const slug = await ensureUniqueSlug(input.slug || input.title);
  const reading = input.reading_time_minutes ?? estimateReadingTime(input.content || "");
  const publishedAt =
    input.status === "published"
      ? input.published_at || new Date().toISOString()
      : input.published_at || null;

  const { category_ids, ...rest } = input;
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...rest,
      slug,
      reading_time_minutes: reading,
      published_at: publishedAt,
      author_name: rest.author_name || "POSHPLEX",
      robots_index: rest.robots_index ?? true,
    })
    .select()
    .single();
  if (error) throw error;

  if (category_ids?.length) {
    await supabase.from("blog_post_categories").insert(
      category_ids.map((cid) => ({ post_id: data.id, category_id: cid }))
    );
  }
  return data as BlogPost;
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
  const patch: any = { ...input };
  delete patch.category_ids;
  if (input.title && !input.slug) {
    // Don't auto-rename slug on title change unless explicit
  }
  if (input.slug) patch.slug = await ensureUniqueSlug(input.slug, id);
  if (input.content) patch.reading_time_minutes = input.reading_time_minutes ?? estimateReadingTime(input.content);
  if (input.status === "published" && !input.published_at) {
    // Set published_at if first publish
    const { data: existing } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    if (!existing?.published_at) patch.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("blog_posts").update(patch).eq("id", id).select().single();
  if (error) throw error;

  if (input.category_ids) {
    await supabase.from("blog_post_categories").delete().eq("post_id", id);
    if (input.category_ids.length > 0) {
      await supabase.from("blog_post_categories").insert(
        input.category_ids.map((cid) => ({ post_id: id, category_id: cid }))
      );
    }
  }
  return data as BlogPost;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) throw error;
}

export async function setBlogPostStatus(id: string, status: BlogPostStatus): Promise<void> {
  const patch: any = { status };
  if (status === "published") {
    const { data: existing } = await supabase.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
    if (!existing?.published_at) patch.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("blog_posts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function incrementPostViews(slug: string): Promise<void> {
  await supabase.rpc("increment_blog_post_views", { p_slug: slug } as any);
}
