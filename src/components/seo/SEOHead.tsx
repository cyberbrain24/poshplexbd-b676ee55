import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { seoService, SITE_URL, type SeoPage } from "@/services/seo.service";

export interface SEOHeadProps {
  /** Override route path (defaults to current pathname) */
  path?: string;
  /** Default meta title used if no DB override */
  title?: string;
  /** Default meta description if no DB override */
  description?: string;
  /** Default OG image */
  image?: string;
  /** og:type default */
  type?: "website" | "article" | "product";
  /** Optional default JSON-LD object */
  jsonLd?: Record<string, any> | Record<string, any>[];
  /** Hint for default canonical (defaults to current path) */
  canonical?: string;
  /** Lookup key for entity-based pages where path may have a slug; if provided uses this for DB lookup */
  lookupPath?: string;
}

const BRAND = "POSHPLEX";
const DEFAULT_DESC = "Streetwear luxury from Bangladesh. Shop the latest drops at POSHPLEX — BE POSH WITH POSHPLEX.";

function pick<T>(...vals: (T | null | undefined | "")[]): T | undefined {
  for (const v of vals) if (v !== null && v !== undefined && v !== "") return v as T;
  return undefined;
}

export default function SEOHead(props: SEOHeadProps) {
  const location = useLocation();
  const currentPath = props.path ?? location.pathname;
  const lookupKey = props.lookupPath ?? currentPath;

  const { data: override } = useQuery<SeoPage | null>({
    queryKey: ["seo_page", lookupKey],
    queryFn: () => seoService.getByPath(lookupKey),
    staleTime: 5 * 60 * 1000,
  });

  const title = pick(override?.meta_title, props.title) ?? `${BRAND} — BE POSH WITH POSHPLEX`;
  const description = pick(override?.meta_description, props.description) ?? DEFAULT_DESC;
  const ogTitle = pick(override?.og_title, override?.meta_title, props.title, title) ?? title;
  const ogDescription = pick(override?.og_description, override?.meta_description, props.description, description) ?? description;
  const ogImage = pick(override?.og_image_url, props.image);
  const ogType = pick(override?.og_type, props.type) ?? "website";
  const canonical = pick(override?.canonical_url, props.canonical, `${SITE_URL}${currentPath}`);
  const twitterCard = override?.twitter_card ?? "summary_large_image";
  const robotsIndex = override?.robots_index ?? true;
  const robotsFollow = override?.robots_follow ?? true;
  const robots = `${robotsIndex ? "index" : "noindex"},${robotsFollow ? "follow" : "nofollow"}`;
  const jsonLdEntries: any[] = [];
  if (override?.json_ld) {
    if (Array.isArray(override.json_ld)) jsonLdEntries.push(...override.json_ld);
    else jsonLdEntries.push(override.json_ld);
  } else if (props.jsonLd) {
    if (Array.isArray(props.jsonLd)) jsonLdEntries.push(...props.jsonLd);
    else jsonLdEntries.push(props.jsonLd);
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      {override?.focus_keyword && <meta name="keywords" content={[override.focus_keyword, ...(override.keywords ?? [])].join(", ")} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {jsonLdEntries.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
}
