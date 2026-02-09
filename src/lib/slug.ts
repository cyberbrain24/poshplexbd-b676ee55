/**
 * Slug utilities for SEO-friendly URLs
 */

/**
 * Generate a URL-safe slug from a product name and ID
 * Format: product-name-[short-id]
 */
export function generateProductSlug(name: string, id: string): string {
  const nameSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Limit length
  
  // Append short ID for uniqueness (first 8 chars of UUID)
  const shortId = id.split('-')[0];
  
  return `${nameSlug}-${shortId}`;
}

/**
 * Extract the product ID from a slug
 * The ID is the last segment after the final hyphen (8 chars)
 */
export function extractIdFromSlug(slug: string): string | null {
  if (!slug) return null;
  
  // Check if it's a full UUID (old format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug;
  }
  
  // Extract short ID from end of slug
  const parts = slug.split('-');
  const shortId = parts[parts.length - 1];
  
  // Short ID should be 8 hex characters
  if (shortId && /^[0-9a-f]{8}$/i.test(shortId)) {
    return shortId;
  }
  
  return null;
}
