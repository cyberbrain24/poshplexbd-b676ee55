import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { useBlogPostBySlug } from "@/hooks/useBlog";
import { incrementPostViews } from "@/services/blog.service";
import PoshplexHeader from "@/components/header/PoshplexHeader";
import PoshplexFooter from "@/components/footer/PoshplexFooter";
import { format } from "date-fns";

const SITE = "https://poshplexbd.com";

const BlogPost = () => {
  const { slug } = useParams();
  const { data: post, isLoading, error } = useBlogPostBySlug(slug);

  useEffect(() => {
    if (post?.slug) incrementPostViews(post.slug).catch(() => {});
  }, [post?.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PoshplexHeader />
        <main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main>
        <PoshplexFooter />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <PoshplexHeader />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="text-2xl font-bold uppercase mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-6">This article may have been moved or unpublished.</p>
          <Link to="/blog" className="text-sm uppercase tracking-widest underline">Back to blog</Link>
        </main>
        <PoshplexFooter />
      </div>
    );
  }

  const url = `${SITE}/blog/${post.slug}`;
  const metaTitle = (post.meta_title || post.title).slice(0, 70);
  const metaDesc = (post.meta_description || post.excerpt || post.title).slice(0, 180);
  const ogImage = post.og_image_url || post.cover_image_url || undefined;
  const canonical = post.canonical_url || url;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: metaDesc,
    image: ogImage ? [ogImage] : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Organization", name: post.author_name || "POSHPLEX" },
    publisher: {
      "@type": "Organization",
      name: "POSHPLEX",
      logo: { "@type": "ImageObject", url: `${SITE}/favicon.ico` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    keywords: post.focus_keyword || undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        {!post.robots_index && <meta name="robots" content="noindex, nofollow" />}
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {post.published_at && <meta property="article:published_time" content={post.published_at} />}
        <meta property="article:modified_time" content={post.updated_at} />
        <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDesc} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <PoshplexHeader />
      <main className="flex-1 px-4 md:px-8 py-8 pb-24">
        <article className="max-w-3xl mx-auto">
          <nav className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/blog" className="hover:text-foreground">Blog</Link>
          </nav>

          {(post.categories?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categories!.map((c) => (
                <span key={c.id} className="text-[10px] uppercase tracking-widest px-2 py-1 bg-muted">{c.name}</span>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tight mb-4">{post.title}</h1>

          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
            By {post.author_name} · {post.published_at ? format(new Date(post.published_at), "MMMM d, yyyy") : ""} · {post.reading_time_minutes} min read
          </div>

          {post.cover_image_url && (
            <img src={post.cover_image_url} alt={post.cover_image_alt || post.title} className="w-full aspect-video object-cover rounded-md mb-8" />
          )}

          {post.excerpt && (
            <p className="text-lg text-muted-foreground italic mb-6 leading-relaxed">{post.excerpt}</p>
          )}

          <div
            className="prose prose-base sm:prose-lg max-w-none prose-headings:uppercase prose-headings:tracking-tight prose-headings:font-bold prose-a:text-foreground prose-a:underline prose-img:rounded-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="mt-12 pt-6 border-t">
            <Link to="/blog" className="text-xs uppercase tracking-widest underline">← Back to all posts</Link>
          </div>
        </article>
      </main>
      <PoshplexFooter />
    </div>
  );
};

export default BlogPost;
