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
  seoLookupPath,
  children,
}: SEOProps) => {
  const location = useLocation();
  const lookupKey = seoLookupPath ?? url ?? location.pathname;
  const { data: override } = useQuery<SeoPage | null>({
    queryKey: ["seo_page", lookupKey],
    queryFn: () => seoService.getByPath(lookupKey),
    staleTime: 5 * 60 * 1000,
    enabled: !!lookupKey,
  });

  const finalTitle = override?.meta_title || generateTitle(title);
  const finalDescription = override?.meta_description || generateDescription(description);
  const finalImage = override?.og_image_url || getImageUrl(image);
  const canonicalUrl = override?.canonical_url || generateCanonicalUrl(url);
  const finalType = (override?.og_type as any) || type;
  const ogTitle = override?.og_title || finalTitle;
  const ogDescription = override?.og_description || finalDescription;
  const robotsIndex = override ? override.robots_index : !noIndex;
  const robotsFollow = override ? override.robots_follow : !noIndex;
  const robotsContent = `${robotsIndex ? "index" : "noindex"},${robotsFollow ? "follow" : "nofollow"}`;
  const overrideJsonLd = override?.json_ld
    ? Array.isArray(override.json_ld) ? override.json_ld : [override.json_ld]
    : [];
  const keywordsList = [override?.focus_keyword, ...(override?.keywords ?? [])].filter(Boolean) as string[];

  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="title" content={finalTitle} />
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsContent} />
      {keywordsList.length > 0 && <meta name="keywords" content={keywordsList.join(", ")} />}

      <meta property="og:type" content={finalType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:site_name" content={SITE_CONFIG.siteName} />

      <meta name="twitter:card" content={override?.twitter_card || "summary_large_image"} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={finalImage} />
      {SITE_CONFIG.twitterHandle && (
        <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
      )}

      {overrideJsonLd.map((ld, i) => (
        <script key={`override-ld-${i}`} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}

      {children}
    </Helmet>
  );
};

export default SEO;
