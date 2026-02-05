import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import DOMPurify from "dompurify";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { useBlogPost, useBlogPostProducts } from "@/hooks/useBlog";
import { format } from "date-fns";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useBlogPost(slug || "");
  const { data: linkedProducts = [] } = useBlogPostProducts(post?.id || "");

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = post?.content
    ? DOMPurify.sanitize(post.content, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'br', 'blockquote', 'img', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
        ALLOW_DATA_ATTR: false,
      })
    : "";

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-20">
          <div className="container mx-auto px-4 max-w-3xl animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4 mb-4" />
            <div className="h-4 bg-muted rounded w-1/4 mb-8" />
            <div className="aspect-video bg-muted rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background py-20 text-center">
          <h1 className="text-2xl font-bold">Post not found</h1>
          <Link to="/blog" className="text-primary underline mt-4 inline-block">
            Back to Blog
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.meta_title || post.title} | Poshplex</title>
        <meta name="description" content={post.meta_description || post.excerpt || ""} />
        {post.focus_keyword && (
          <meta name="keywords" content={post.focus_keyword} />
        )}
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        {/* Back Link */}
        <div className="container mx-auto px-4 pt-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        {/* Header */}
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          <header className="text-center mb-12">
            {post.category && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">
                {post.category.name}
              </p>
            )}
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              {post.title}
            </h1>
            {post.published_at && (
              <p className="text-muted-foreground mt-4">
                {format(new Date(post.published_at), "MMMM d, yyyy")}
              </p>
            )}
          </header>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-12">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content - Sanitized to prevent XSS */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>

        {/* Shop The Look */}
        {linkedProducts.length > 0 && (
          <section className="border-t border-border py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-center mb-8">Shop The Look</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {linkedProducts.map((item: any) => {
                  const product = item.product;
                  const mainImage = product.images?.find((img: any) => img.is_main)?.image_url || product.images?.[0]?.image_url;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="group"
                    >
                      <div className="aspect-square overflow-hidden bg-muted rounded-lg">
                        {mainImage ? (
                          <img
                            src={mainImage}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="text-sm font-medium group-hover:underline">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">${product.base_price}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
};

export default BlogPost;
