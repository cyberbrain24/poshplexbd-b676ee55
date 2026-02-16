/**
 * Lightweight IP-based rate limiter for edge functions
 * Uses in-memory store (resets on cold start, which is acceptable for edge)
 * 
 * Config: max 10 requests per minute per IP, 15-minute block after abuse
 */

interface RateEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

const store = new Map<string, RateEntry>();

const WINDOW_MS = 60_000;       // 1 minute window
const MAX_REQUESTS = 10;        // max requests per window
const BLOCK_DURATION_MS = 15 * 60_000; // 15-minute block

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
function cleanupStale() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > BLOCK_DURATION_MS + WINDOW_MS) {
      store.delete(key);
    }
  }
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  cleanupStale();
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { count: 1, windowStart: now, blocked: false, blockedUntil: 0 };
    store.set(ip, entry);
    return { allowed: true };
  }

  // Check if currently blocked
  if (entry.blocked) {
    if (now < entry.blockedUntil) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return { allowed: false, retryAfter };
    }
    // Block expired, reset
    entry.blocked = false;
    entry.count = 1;
    entry.windowStart = now;
    return { allowed: true };
  }

  // Check if window expired
  if (now - entry.windowStart > WINDOW_MS) {
    entry.count = 1;
    entry.windowStart = now;
    return { allowed: true };
  }

  // Increment count
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    // Block the IP
    entry.blocked = true;
    entry.blockedUntil = now + BLOCK_DURATION_MS;
    return { allowed: false, retryAfter: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }

  return { allowed: true };
}

export function rateLimitResponse(corsHeaders: Record<string, string>, retryAfter?: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
      },
    }
  );
}
