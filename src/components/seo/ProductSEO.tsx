import SEO from "./SEO";
import JsonLD from "./JsonLD";
import {
  SITE_CONFIG,
  generateProductSchema,
  generateBreadcrumbSchema,
  generateTitle,
  generateDescription,
  getImageUrl,
} from "@/utils/seo-helpers";
import { generateProductSlug } from "@/lib/slug";
import type { Product } from "@/types/product";

interface ProductSEOProps {
  product: Product | null | undefined;
}

/**
 * SEO component specifically for product pages
 * Generates product schema, breadcrumbs, and Open Graph tags
 */
const ProductSEO = ({ product }: ProductSEOProps) => {
  if (!product) return null;

  const mainImage = product.images?.find((img) => img.is_main)?.image_url ||
    product.images?.[0]?.image_url;

  const productSlug = generateProductSlug(product.name, product.id);
  const productUrl = `${SITE_CONFIG.siteUrl}/product/${productSlug}`;
  const categoryName = product.category?.name || "Products";
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, "-");

  // All products are always in stock
  const inStock = true;

  // Get the lowest variant price or base price
  const price = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.selling_price))
    : product.base_price;

  // Generate JSON-LD schemas
  const productSchema = generateProductSchema({
    name: product.name,
    description: product.short_description || product.full_description,
    sku: product.sku,
    price,
    image: mainImage,
    brand: product.brand?.name,
    category: categoryName,
    inStock,
    url: productUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: categoryName, url: `/category/${categorySlug}` },
    { name: product.name, url: `/product/${productSlug}` },
  ]);

  return (
    <>
      <SEO
        title={product.name}
        description={product.short_description || product.full_description}
        image={mainImage}
        url={`/product/${productSlug}`}
        type="product"
      />
      <JsonLD data={[productSchema, breadcrumbSchema]} />
    </>
  );
};

export default ProductSEO;
