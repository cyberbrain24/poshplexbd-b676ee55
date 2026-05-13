import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { seoService, type SeoPage } from "@/services/seo.service";

/**
 * Global SEO override — mounted once at the app root.
 * For ANY pathname that has a row in `seo_pages`, this injects/overrides
 * meta tags. Because react-helmet-async dedupes by name/property, these
 * tags override the ones from index.html and from per-page <SEO/> components
 * (since this component renders LAST inside HelmetProvider's resolution order
 * for matching meta names — admin overrides win).
 *
 * If no override exists for the path, this renders nothing.
 *
 * Perf: the lookup is deferred until after first paint (idle / 1.5s fallback)
 * so the homepage LCP isn't blocked by a Supabase round-trip on Slow-4G.
 */
export default function GlobalSEOOverride() {
  const location = useLocation();
  const path = location.pathname;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, [path]);

  const { data: override } = useQuery<SeoPage | null>({
    queryKey: ["seo_page", path],
    queryFn: () => seoService.getByPath(path),
    staleTime: 5 * 60 * 1000,
    enabled: ready && !!path,
  });

  if (!override) return null;

  const robotsContent = `${override.robots_index ? "index" : "noindex"},${override.robots_follow ? "follow" : "nofollow"}`;
  const jsonLdEntries = override.json_ld
    ? Array.isArray(override.json_ld) ? override.json_ld : [override.json_ld]
    : [];
  const keywordsList = [override.focus_keyword, ...(override.keywords ?? [])].filter(Boolean) as string[];

  return (
    <Helmet prioritizeSeoTags>
      {override.meta_title && <title>{override.meta_title}</title>}
      {override.meta_description && <meta name="description" content={override.meta_description} />}
      <meta name="robots" content={robotsContent} />
      {keywordsList.length > 0 && <meta name="keywords" content={keywordsList.join(", ")} />}
      {override.canonical_url && <link rel="canonical" href={override.canonical_url} />}
      {override.og_title && <meta property="og:title" content={override.og_title} />}
      {override.og_description && <meta property="og:description" content={override.og_description} />}
      {override.og_type && <meta property="og:type" content={override.og_type} />}
      {override.og_image_url && <meta property="og:image" content={override.og_image_url} />}
      {override.canonical_url && <meta property="og:url" content={override.canonical_url} />}
      <meta name="twitter:card" content={override.twitter_card || "summary_large_image"} />
      {override.og_title && <meta name="twitter:title" content={override.og_title} />}
      {override.og_description && <meta name="twitter:description" content={override.og_description} />}
      {override.og_image_url && <meta name="twitter:image" content={override.og_image_url} />}
      {jsonLdEntries.map((ld, i) => (
        <script key={`global-ld-${i}`} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
