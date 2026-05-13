export type BlogPostStatus = "draft" | "published" | "scheduled";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  post_count?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  status: BlogPostStatus;
  published_at: string | null;
  author_name: string;
  reading_time_minutes: number;
  view_count: number;
  // Advanced SEO
  focus_keyword: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  robots_index: boolean;
  created_at: string;
  updated_at: string;
  categories?: BlogCategory[];
}

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  status: BlogPostStatus;
  published_at?: string | null;
  author_name?: string;
  reading_time_minutes?: number;
  focus_keyword?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_image_url?: string | null;
  robots_index?: boolean;
  category_ids?: string[];
}
