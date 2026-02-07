import { usePoshplexSEO } from "@/hooks/useSEO";
import SEO from "./SEO";
import JsonLD from "./JsonLD";
import {
  SITE_CONFIG,
  generateProductSchema,
  generateBlogSchema,
  generateCategorySchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-helpers";

interface SEOHandlerProps {
  // Optional overrides for when you have entity data
  entityData?: {
    type: "product" | "blog" | "category" | "custom";
    name?: string;
    description?: string;
    image?: string;
    price?: number;
    inStock?: boolean;
    publishedAt?: string;
    updatedAt?: string;
    brand?: string;
    sku?: string;
    itemCount?: number;
  };
  // Breadcrumb items
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * Universal SEO Handler Component
 * Automatically detects current path and applies appropriate SEO
 * Falls back to smart defaults when no custom SEO is set
 */
const SEOHandler = ({ entityData, breadcrumbs }: SEOHandlerProps) => {
  const { data: seoData, isLoading } = usePoshplexSEO();

  // Don't render anything while loading to prevent flicker
  if (isLoading) return null;

  // Determine final values with smart fallbacks
  const title = seoData?.meta_title || entityData?.name || undefined;
  const description = seoData?.meta_description || entityData?.description || undefined;
  const image = seoData?.og_image || entityData?.image || undefined;
  const noIndex = seoData?.no_index || false;
  const canonical = seoData?.canonical_url || undefined;

  // Generate JSON-LD based on entity type or json_ld_type from DB
  const generateSchemas = () => {
    const schemas: object[] = [];
    const jsonLdType = seoData?.json_ld_type || entityData?.type;

    switch (jsonLdType) {
      case "Product":
      case "product":
        if (entityData?.name && entityData?.price !== undefined) {
          schemas.push(
            generateProductSchema({
              name: entityData.name,
              description: entityData.description,
              price: entityData.price,
              image: entityData.image,
              inStock: entityData.inStock,
              brand: entityData.brand,
              sku: entityData.sku,
              url: `${SITE_CONFIG.siteUrl}${seoData?.page_path || ""}`,
            })
          );
        }
        break;

      case "Article":
      case "blog":
        if (entityData?.name) {
          schemas.push(
            generateBlogSchema({
              title: entityData.name,
              description: entityData.description,
              image: entityData.image,
              publishedAt: entityData.publishedAt,
              updatedAt: entityData.updatedAt,
              url: `${SITE_CONFIG.siteUrl}${seoData?.page_path || ""}`,
            })
          );
        }
        break;

      case "CollectionPage":
      case "category":
        if (entityData?.name) {
          schemas.push(
            generateCategorySchema({
              name: entityData.name,
              description: entityData.description,
              url: `${SITE_CONFIG.siteUrl}${seoData?.page_path || ""}`,
              itemCount: entityData.itemCount,
            })
          );
        }
        break;

      case "WebSite":
        schemas.push(generateOrganizationSchema());
        schemas.push(generateWebsiteSchema());
        break;

      default:
        // For unknown types, just add organization schema
        schemas.push(generateOrganizationSchema());
    }

    // Add breadcrumbs if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbs));
    }

    return schemas;
  };

  const schemas = generateSchemas();

  // Determine OG type
  const getOgType = (): "website" | "article" | "product" => {
    const type = seoData?.json_ld_type || entityData?.type;
    if (type === "Article" || type === "blog") return "article";
    if (type === "Product" || type === "product") return "product";
    return "website";
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        image={image}
        url={seoData?.page_path || ""}
        type={getOgType()}
        noIndex={noIndex}
      />
      {schemas.length > 0 && <JsonLD data={schemas} />}
    </>
  );
};

export default SEOHandler;
