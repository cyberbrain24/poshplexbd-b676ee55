import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePageBySlug } from "@/hooks/usePages";
import { useSEOByPath } from "@/hooks/useSEO";
import Header from "@/components/header/PoshplexHeader";
import Footer from "@/components/footer/PoshplexFooter";
import DOMPurify from "dompurify";
import { Skeleton } from "@/components/ui/skeleton";

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, isError } = usePageBySlug(slug || "");
  const { data: seoData } = useSEOByPath(`/${slug}`);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <Skeleton className="h-12 w-1/3 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </main>
        <Footer />
      </div>
    );
  }

  // Page not found - redirect to 404
  if (isError || !page) {
    return <Navigate to="/404" replace />;
  }

  // Sanitize content for XSS protection
  const sanitizedContent = DOMPurify.sanitize(page.content || "", {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "strong", "em", "u", "s",
      "ul", "ol", "li", "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "target"],
  });

  // SEO data with fallbacks
  const metaTitle = seoData?.meta_title || page.title;
  const metaDescription = seoData?.meta_description || page.excerpt || "";
  const ogImage = seoData?.og_image || page.cover_image || "";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle} | Poshplex</title>
        <meta name="description" content={metaDescription} />
        {seoData?.focus_keywords && (
          <meta name="keywords" content={seoData.focus_keywords.join(", ")} />
        )}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`https://poshplexbd.lovable.app/${slug}`} />
        
        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: metaTitle,
            description: metaDescription,
            url: `https://poshplexbd.lovable.app/${slug}`,
            ...(ogImage && { image: ogImage }),
            dateModified: page.updated_at,
            ...(page.published_at && { datePublished: page.published_at }),
          })}
        </script>
      </Helmet>

      <Header />

      <main className="flex-1">
        {/* Hero Section with Cover Image */}
        {page.cover_image && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={page.cover_image}
              alt={page.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {page.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <article className="container py-12">
          {!page.cover_image && (
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{page.title}</h1>
          )}

          {page.excerpt && !page.cover_image && (
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              {page.excerpt}
            </p>
          )}

          <div
            className="prose prose-lg max-w-none dark:prose-invert
              prose-headings:font-semibold
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
              prose-ul:text-muted-foreground prose-ol:text-muted-foreground
              prose-li:marker:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default DynamicPage;
