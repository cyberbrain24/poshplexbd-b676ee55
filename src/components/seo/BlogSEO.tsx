import SEO from "./SEO";
import JsonLD from "./JsonLD";
import {
  SITE_CONFIG,
  generateBlogSchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-helpers";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  category?: { name: string } | null;
}

interface BlogSEOProps {
  post: BlogPost | null | undefined;
}

/**
 * SEO component specifically for blog post pages
 * Generates article schema, breadcrumbs, and Open Graph tags
 */
const BlogSEO = ({ post }: BlogSEOProps) => {
  if (!post) return null;

  const postUrl = `${SITE_CONFIG.siteUrl}/blog/${post.slug}`;

  // Use custom meta or fallback to content
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt;

  // Generate JSON-LD schemas
  const blogSchema = generateBlogSchema({
    title: post.title,
    description,
    image: post.cover_image,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
    url: postUrl,
  });

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ];

  if (post.category) {
    breadcrumbItems.push({
      name: post.category.name,
      url: `/blog?category=${post.category.name.toLowerCase()}`,
    });
  }

  breadcrumbItems.push({ name: post.title, url: `/blog/${post.slug}` });

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);

  return (
    <>
      <SEO
        title={title}
        description={description}
        image={post.cover_image}
        url={`/blog/${post.slug}`}
        type="article"
      />
      <JsonLD data={[blogSchema, breadcrumbSchema]} />
    </>
  );
};

export default BlogSEO;
