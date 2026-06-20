/**
 * Poshplex Lightweight SEO Helpers
 * Generates metadata, JSON-LD, and Open Graph tags from existing data
 */

// Site configuration
export const SITE_CONFIG = {
  siteName: "Poshplex",
  siteUrl: "https://poshplexbd.com",
  defaultDescription: "Discover Poshplex - Be Posh With Poshplex. Shop our curated streetwear collection designed for style-conscious individuals.",
  defaultImage: "/og-image.jpg",
  twitterHandle: "@poshplex",
};

// Truncate text to a specific length for meta descriptions
export const truncateText = (text: string | null | undefined, maxLength = 160): string => {
  if (!text) return SITE_CONFIG.defaultDescription;
  const cleaned = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength - 3).trim() + '...';
};

// Generate smart title with fallback
export const generateTitle = (
  itemName?: string | null,
  customTitle?: string | null,
  suffix = SITE_CONFIG.siteName
): string => {
  if (customTitle) return customTitle;
  if (itemName) return `${itemName} | ${suffix}`;
  return suffix;
};

// Generate meta description with smart fallback
export const generateDescription = (
  description?: string | null,
  customDescription?: string | null,
  fallbackContent?: string | null
): string => {
  if (customDescription) return truncateText(customDescription);
  if (description) return truncateText(description);
  if (fallbackContent) return truncateText(fallbackContent);
  return SITE_CONFIG.defaultDescription;
};

// Get image URL with fallback
export const getImageUrl = (
  imageUrl?: string | null,
  fallbackUrl?: string | null
): string => {
  const url = imageUrl || fallbackUrl || SITE_CONFIG.defaultImage;
  // Convert relative URLs to absolute
  if (url.startsWith('/')) {
    return `${SITE_CONFIG.siteUrl}${url}`;
  }
  return url;
};

// Generate canonical URL
export const generateCanonicalUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.siteUrl}${cleanPath}`;
};

// Auto-generate alt text for images
export const generateAltText = (
  existingAlt?: string | null,
  productName?: string | null,
  fallback = "Poshplex product image"
): string => {
  if (existingAlt) return existingAlt;
  if (productName) return `${productName} - ${SITE_CONFIG.siteName}`;
  return fallback;
};

// ============ JSON-LD Schema Generators ============

export interface ProductSchemaData {
  name: string;
  description?: string | null;
  sku?: string;
  price: number;
  currency?: string;
  image?: string | null;
  brand?: string | null;
  category?: string | null;
  inStock?: boolean;
  url: string;
}

export const generateProductSchema = (data: ProductSchemaData): object => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: data.name,
  description: truncateText(data.description, 5000),
  sku: data.sku,
  image: getImageUrl(data.image),
  brand: data.brand ? {
    "@type": "Brand",
    name: data.brand,
  } : undefined,
  category: data.category,
  offers: {
    "@type": "Offer",
    url: data.url,
    priceCurrency: data.currency || "BDT",
    price: data.price,
    availability: data.inStock !== false 
      ? "https://schema.org/InStock" 
      : "https://schema.org/OutOfStock",
    seller: {
      "@type": "Organization",
      name: SITE_CONFIG.siteName,
    },
  },
});

export interface BlogSchemaData {
  title: string;
  description?: string | null;
  image?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  url: string;
}

export const generateBlogSchema = (data: BlogSchemaData): object => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: data.title,
  description: truncateText(data.description, 5000),
  image: getImageUrl(data.image),
  author: {
    "@type": "Person",
    name: data.author || SITE_CONFIG.siteName,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_CONFIG.siteName,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_CONFIG.siteUrl}/favicon.ico`,
    },
  },
  datePublished: data.publishedAt,
  dateModified: data.updatedAt || data.publishedAt,
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": data.url,
  },
});

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const generateBreadcrumbSchema = (items: BreadcrumbItem[]): object => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.siteUrl}${item.url}`,
  })),
});

export const generateOrganizationSchema = (): object => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_CONFIG.siteName,
  url: SITE_CONFIG.siteUrl,
  logo: `${SITE_CONFIG.siteUrl}/favicon.ico`,
  sameAs: [
    // Add social media URLs here
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["English", "Bengali"],
  },
});

export const generateWebsiteSchema = (): object => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_CONFIG.siteName,
  url: SITE_CONFIG.siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_CONFIG.siteUrl}/category/all?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

export interface CategorySchemaData {
  name: string;
  description?: string | null;
  url: string;
  itemCount?: number;
}

export const generateCategorySchema = (data: CategorySchemaData): object => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: data.name,
  description: data.description || `Browse our ${data.name} collection at ${SITE_CONFIG.siteName}`,
  url: data.url,
  numberOfItems: data.itemCount,
  isPartOf: {
    "@type": "WebSite",
    name: SITE_CONFIG.siteName,
  },
});
