import SEO from "./SEO";
import JsonLD from "./JsonLD";
import {
  SITE_CONFIG,
  generateCategorySchema,
  generateBreadcrumbSchema,
} from "@/utils/seo-helpers";

interface CategorySEOProps {
  categoryName: string;
  categorySlug: string;
  itemCount?: number;
  description?: string;
}

/**
 * SEO component specifically for category/collection pages
 * Generates collection schema, breadcrumbs, and Open Graph tags
 */
const CategorySEO = ({
  categoryName,
  categorySlug,
  itemCount,
  description,
}: CategorySEOProps) => {
  const categoryUrl = `${SITE_CONFIG.siteUrl}/category/${categorySlug}`;
  const pageDescription =
    description || `Browse our ${categoryName} collection. ${itemCount ? `${itemCount} items available.` : ""} Shop premium fashion at ${SITE_CONFIG.siteName}.`;

  // Generate JSON-LD schemas
  const categorySchema = generateCategorySchema({
    name: categoryName,
    description: pageDescription,
    url: categoryUrl,
    itemCount,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: categoryName, url: `/category/${categorySlug}` },
  ]);

  return (
    <>
      <SEO
        title={categoryName}
        description={pageDescription}
        url={`/category/${categorySlug}`}
        type="website"
      />
      <JsonLD data={[categorySchema, breadcrumbSchema]} />
    </>
  );
};

export default CategorySEO;
