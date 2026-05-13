import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import {
  SITE_CONFIG,
  generateTitle,
  generateDescription,
  getImageUrl,
  generateCanonicalUrl,
} from "@/utils/seo-helpers";
import { seoService, type SeoPage } from "@/services/seo.service";

export interface SEOProps {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string;
  type?: "website" | "article" | "product";
  noIndex?: boolean;
  /** Optional explicit lookup key for DB overrides (defaults to current pathname) */
  seoLookupPath?: string;
  children?: React.ReactNode;
}

/**
 * Lightweight SEO wrapper component
 * Injects meta tags, Open Graph, and Twitter cards into document head
 */
const SEO = ({
  title,
  description,
  image,
  url = "",
  type = "website",
  noIndex = false,
  children,
}: SEOProps) => {
  const pageTitle = generateTitle(title);
  const pageDescription = generateDescription(description);
  const pageImage = getImageUrl(image);
  const canonicalUrl = generateCanonicalUrl(url);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={SITE_CONFIG.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />
      {SITE_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
      )}

      {/* Additional structured data from children */}
      {children}
    </Helmet>
  );
};

export default SEO;
