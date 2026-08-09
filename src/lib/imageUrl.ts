/**
 * Rewrites public storage image URLs to the site's own `/img/*` edge route so
 * Cloudflare caches them at the CDN edge instead of hitting the storage origin
 * on every request.
 *
 * Only applied when the app is served from a host that actually runs the
 * Cloudflare Pages Function (production domain / *.pages.dev). Everywhere else
 * (localhost, Lovable preview) the original URL is returned unchanged.
 */

const PUBLIC_OBJECT_MARKER = "/storage/v1/object/public/";

const proxyEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host.endsWith("poshplexbd.com") || host.endsWith(".pages.dev");
};

export const cdnImage = <T extends string | null | undefined>(url: T): T => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes(PUBLIC_OBJECT_MARKER)) return url;
  if (!proxyEnabled()) return url;

  const index = url.indexOf(PUBLIC_OBJECT_MARKER);
  const objectPath = url.slice(index + PUBLIC_OBJECT_MARKER.length);
  return (`/img/${objectPath}`) as T;
};
