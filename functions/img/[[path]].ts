/**
 * Cloudflare Pages Function — edge image proxy.
 *
 * Serves backend storage objects through the site's own domain so Cloudflare's
 * CDN caches them at the edge (the storage origin is a third-party domain and
 * would otherwise bypass the cache entirely).
 *
 * Route:  /img/<bucket>/<path/to/file.webp>
 * Origin: <STORAGE_ORIGIN>/storage/v1/object/public/<bucket>/<path/to/file.webp>
 *
 * Only public storage objects are reachable — the path is always prefixed with
 * `/storage/v1/object/public/`, so no private or API route can be proxied.
 */

const DEFAULT_STORAGE_ORIGIN = "https://zspmhkzosumopyfmlwvl.supabase.co";
const EDGE_TTL = 60 * 60 * 24 * 365; // 1 year — object URLs are content-addressed

interface Env {
  STORAGE_ORIGIN?: string;
  VITE_SUPABASE_URL?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params, waitUntil } = context;

  const segments = Array.isArray(params.path) ? params.path : [params.path];
  const objectPath = segments.filter(Boolean).join("/");
  if (!objectPath || objectPath.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const origin = (env.STORAGE_ORIGIN || env.VITE_SUPABASE_URL || DEFAULT_STORAGE_ORIGIN).replace(/\/$/, "");
  const upstream = `${origin}/storage/v1/object/public/${objectPath}`;

  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstreamRes = await fetch(upstream, {
    cf: { cacheEverything: true, cacheTtl: EDGE_TTL },
    headers: { accept: request.headers.get("accept") || "image/*" },
  });

  if (!upstreamRes.ok) {
    return new Response("Not found", { status: upstreamRes.status === 404 ? 404 : 502 });
  }

  const headers = new Headers(upstreamRes.headers);
  headers.set("Cache-Control", `public, max-age=${EDGE_TTL}, immutable`);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.delete("set-cookie");

  const response = new Response(upstreamRes.body, { status: 200, headers });
  waitUntil(cache.put(cacheKey, response.clone()));
  return response;
};
