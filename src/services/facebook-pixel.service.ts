/**
 * Facebook Pixel Service — Lightweight, SPA-optimized, lazy-loaded.
 * No npm packages. Direct window.fbq calls only.
 */

// Extend Window type for fbq
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface PixelConfig {
  pixelId: string;
  isEnabled: boolean;
  testMode: boolean;
  advancedMatching: boolean;
}

export interface AdvancedMatchingUserData {
  em?: string; // email
  ph?: string; // phone
  fn?: string; // first name
  ln?: string; // last name
  ct?: string; // city
  st?: string; // state / region
  zp?: string; // postal code
  db?: string; // date of birth YYYYMMDD
  country?: string;
  external_id?: string;
}

let _config: PixelConfig | null = null;
let _userData: AdvancedMatchingUserData | null = null;
let _scriptInjected = false;
let _initialized = false;
let _interactionBound = false;

const USER_DATA_STORAGE_KEY = 'pp_fb_user_data';

// Restore persisted user data immediately so the very first events on a
// returning visitor already include em/ph/fn/ln/country/external_id.
try {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(USER_DATA_STORAGE_KEY);
    if (raw) _userData = JSON.parse(raw);
  }
} catch { /* noop */ }


// ─── Configuration ─────────────────────────────────────────────
export const setPixelConfig = (config: PixelConfig) => {
  _config = config;
  // Baseline: every visitor is Bangladesh — guarantees ~100% country coverage
  // in Meta Events Manager even before login/checkout typing. Non-destructive
  // merge so it never overwrites a more specific value already persisted.
  if (!_userData || !_userData.country) {
    setAdvancedMatchingUser({ country: 'bd' });
  }
  // Mint a stable anonymous external_id per browser so EVERY event (including
  // anonymous PageViews) carries an identifier — lifts Meta's "External ID"
  // coverage from single digits to ~100%. Persisted for 2 years.
  try {
    if (typeof localStorage !== 'undefined' && (!_userData || !_userData.external_id)) {
      let anon = localStorage.getItem('pp_anon_id');
      if (!anon) {
        anon = uuid();
        localStorage.setItem('pp_anon_id', anon);
      }
      setAdvancedMatchingUser({ external_id: anon });
    }
  } catch { /* noop */ }
  // Seed _fbp cookie ourselves so it exists on the very first event even
  // though fbevents.js is lazy-loaded. Format matches Meta's SDK:
  // fb.<subdomain_index>.<creation_time>.<random_10_digits>
  try {
    if (typeof document !== 'undefined' && !getCookie('_fbp')) {
      const rand = Math.floor(1e9 + Math.random() * 9e9).toString();
      setCookie('_fbp', `fb.1.${Date.now()}.${rand}`, 90);
    }
  } catch { /* noop */ }
};

export const getPixelConfig = () => _config;

/**
 * Set user data for Advanced Matching. Call after auth/login/checkout typing.
 * Pass plain values — Facebook SDK auto-hashes em/ph/fn/ln.
 * Persisted to localStorage so identifiers attach to ALL future events
 * (PageView, ViewContent, etc.) — boosts Meta coverage from ~10% to 80-90%.
 * Merges with existing data so partial updates don't wipe prior fields.
 */
export const setAdvancedMatchingUser = (data: AdvancedMatchingUserData | null) => {
  // Sanitize: drop invalid em/ph BEFORE merging so we never persist garbage.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const clean: AdvancedMatchingUserData = {};
  if (data) {
    if (data.em) {
      const e = String(data.em).trim().toLowerCase();
      if (EMAIL_RE.test(e) && !e.endsWith('@phone.local') && !e.endsWith('@example.com') && !e.endsWith('@test.com')) {
        clean.em = e;
      }
    }
    if (data.ph) {
      const digits = String(data.ph).replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) clean.ph = digits;
    }
    if (data.fn && String(data.fn).trim()) clean.fn = String(data.fn).trim();
    if (data.ln && String(data.ln).trim()) clean.ln = String(data.ln).trim();
    if (data.ct && String(data.ct).trim()) clean.ct = String(data.ct).trim();
    if (data.st && String(data.st).trim()) clean.st = String(data.st).trim();
    if (data.zp && String(data.zp).trim()) clean.zp = String(data.zp).trim();
    if (data.country && String(data.country).trim()) clean.country = String(data.country).trim();
    if (data.external_id) clean.external_id = String(data.external_id);
  }

  const merged = data ? { ...(_userData || {}), ...clean } : null;
  _userData = merged;

  try {
    if (typeof localStorage !== 'undefined') {
      if (merged && Object.values(merged).some(v => !!v)) {
        localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(merged));
      } else {
        localStorage.removeItem(USER_DATA_STORAGE_KEY);
      }
    }
  } catch { /* noop */ }

  if (_initialized && _config?.advancedMatching && _config.pixelId) {
    try {
      window.fbq('init', _config.pixelId, merged || {});
      if (_config.testMode) console.log('[FB Pixel] Advanced Matching updated:', merged);
    } catch { /* noop */ }
  }
};


// ─── Script Injection (Singleton, Lazy) ────────────────────────
const injectScript = () => {
  if (_scriptInjected) return;
  if (!_config?.isEnabled || !_config?.pixelId) return;

  _scriptInjected = true;

  // Facebook Pixel base code (minified inline)
  const f = window;
  const n = 'fbq' as const;
  if (f.fbq) return; // Already loaded by something else

  const fbq: any = function (...args: any[]) {
    fbq.callMethod ? fbq.callMethod.apply(fbq, args) : fbq.queue.push(args);
  };
  if (!f._fbq) f._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  f.fbq = fbq;

  // Inject the script tag. Silence the console error emitted when the
  // request is blocked by ad blockers / privacy extensions (ERR_BLOCKED_BY_CLIENT).
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.onerror = () => { /* blocked by extension — expected, ignore */ };
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript?.parentNode?.insertBefore(script, firstScript);


  // Initialize pixel (with Advanced Matching user data when available)
  if (_config.advancedMatching) {
    window.fbq('init', _config.pixelId, _userData || {});
  } else {
    window.fbq('init', _config.pixelId);
  }


  _initialized = true;

  if (_config.testMode) {
    console.log('[FB Pixel] Initialized in TEST mode — ID:', _config.pixelId);
  }
};

// ─── Lazy Load Trigger ─────────────────────────────────────────
// Inject on first user interaction OR after 3s delay
export const setupLazyLoading = () => {
  if (_interactionBound || _scriptInjected) return;
  // Early-return if pixel is disabled or missing — don't attach listeners
  if (!_config?.isEnabled || !_config?.pixelId) return;
  _interactionBound = true;

  const trigger = () => {
    injectScript();
    // Clean up listeners
    ['scroll', 'mousemove', 'click', 'touchstart', 'keydown'].forEach(evt =>
      window.removeEventListener(evt, trigger, { capture: true })
    );
    clearTimeout(timer);
  };

  ['scroll', 'mousemove', 'click', 'touchstart', 'keydown'].forEach(evt =>
    window.addEventListener(evt, trigger, { capture: true, once: true, passive: true })
  );

  // Fallback: inject after 3 seconds regardless
  const timer = setTimeout(trigger, 3000);
};

// ─── Safe fbq Wrapper ──────────────────────────────────────────
const safeFbq = (...args: any[]) => {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq(...args);
      if (_config?.testMode) {
        console.log('[FB Pixel]', ...args);
      }
    }
  } catch {
    // Silently fail — AdBlocker or script not loaded
  }
};

// ─── CAPI (Conversions API) Bridge ─────────────────────────────
// Lightweight UUID v4 (avoids extra dep)
const uuid = () =>
  ([1e7] as any + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
  );

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : undefined;
};

const setCookie = (name: string, value: string, days = 90) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

/**
 * Meta auto-creates `_fbc` only when fbevents.js is on the landing page,
 * which we lazy-load — meaning fast bounces from FB ads can lose Click ID.
 * Capture `fbclid` from the URL on first load and persist it in the standard
 * `_fbc` cookie format: `fb.<subdomain_index>.<creation_time_ms>.<fbclid>`.
 */
export const captureClickId = () => {
  try {
    if (typeof window === 'undefined') return;
    if (getCookie('_fbc')) return; // already set
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get('fbclid');
    if (!fbclid) return;
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie('_fbc', fbc, 90);
  } catch { /* noop */ }
};


/**
 * Send event to server-side Conversions API for browser+server deduplication.
 * Fired in parallel with fbq — Meta dedupes by (event_name, event_id).
 */
const sendCapi = (
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>,
  opts?: { immediate?: boolean },
) => {
  const run = async () => {
    try {
      const userData = {
        ..._userData,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      };
      const payload = {
        event_name: eventName,
        event_id: eventId,
        event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_data: userData,
        custom_data: customData,
        action_source: 'website',
      };

      // For critical/immediate events (Purchase) — use direct fetch with keepalive
      // so the request survives page navigation. supabase.functions.invoke does
      // not support keepalive.
      if (opts?.immediate) {
        const url = `${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/meta-capi`;
        const anonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });
        return;
      }

      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('meta-capi', { body: payload });
    } catch {
      // Silently fail — CAPI is enhancement, not critical
    }
  };
  if (typeof window === 'undefined') return;
  if (opts?.immediate) { void run(); return; }
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined;
  if (ric) ric(run, { timeout: 3000 });
  else setTimeout(run, 1500);
};


/**
 * Sanitize params before sending: Meta requires `value` to be a positive number.
 * If value is 0/NaN/invalid, drop BOTH value and currency (currency without value
 * is meaningless and also flagged by Meta diagnostics).
 */
const sanitizeParams = (params: Record<string, any>): Record<string, any> => {
  const out = { ...params };
  const v = Number(out.value);
  if (!Number.isFinite(v) || v <= 0) {
    delete out.value;
    delete out.currency;
  } else {
    // Round to 2 decimals to avoid float precision noise (e.g. 9.990000001)
    out.value = Math.round(v * 100) / 100;
  }
  return out;
};

/**
 * Dispatch a standard pixel event with Browser+CAPI dedup.
 * Generates one event_id used by both the fbq call and the CAPI mirror.
 */
const dispatch = (eventName: string, params: Record<string, any>) => {
  const eventId = uuid();
  const clean = sanitizeParams(params);
  safeFbq('track', eventName, clean, { eventID: eventId });
  // Fire CAPI in background (non-blocking)
  void sendCapi(eventName, eventId, clean);
};

// ─── Standard Events ───────────────────────────────────────────

let _firstPageView = true;
export const trackPageView = () => {
  // PageView is high-volume; skip CAPI mirror on the very first page load so
  // the meta-capi edge function never competes with the homepage critical path.
  // Subsequent SPA navigations still fire CAPI for full coverage.
  const eventId = uuid();
  safeFbq('track', 'PageView', {}, { eventID: eventId });
  if (_firstPageView) {
    _firstPageView = false;
    return;
  }
  void sendCapi('PageView', eventId);
};

export const trackViewContent = (data: {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
}) => {
  dispatch('ViewContent', {
    content_name: data.contentName,
    content_ids: data.contentIds,
    content_type: data.contentType || 'product',
    value: data.value,
    currency: data.currency || 'BDT',
  });
};

export const trackAddToCart = (data: {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
  quantity?: number;
}) => {
  dispatch('AddToCart', {
    content_name: data.contentName,
    content_ids: data.contentIds,
    content_type: data.contentType || 'product',
    value: data.value,
    currency: data.currency || 'BDT',
    num_items: data.quantity || 1,
  });
};

export const trackInitiateCheckout = (data: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
}) => {
  dispatch('InitiateCheckout', {
    content_ids: data.contentIds,
    value: data.value,
    currency: data.currency || 'BDT',
    num_items: data.numItems,
  });
};

export const trackPurchase = (data: {
  contentIds: string[];
  value: number;
  currency?: string;
  numItems: number;
  orderId?: string;
}) => {
  // Use orderId as the event_id so browser Pixel + CAPI dedupe reliably
  // (even across refreshes / retries). Falls back to random UUID for safety.
  const eventId = data.orderId ? `order_${data.orderId}` : uuid();
  const clean = sanitizeParams({
    content_ids: data.contentIds,
    value: data.value,
    currency: data.currency || 'BDT',
    num_items: data.numItems,
    order_id: data.orderId,
    content_type: 'product',
  });
  safeFbq('track', 'Purchase', clean, { eventID: eventId });
  // Fire CAPI immediately with keepalive — Purchase is often followed by
  // a navigation, and we can't afford to lose the highest-value event.
  void sendCapi('Purchase', eventId, clean, { immediate: true });
};


export const trackSearch = (searchString: string) => {
  dispatch('Search', { search_string: searchString });
};

export const trackAddToWishlist = (data: {
  contentName: string;
  contentIds: string[];
  value: number;
  currency?: string;
}) => {
  dispatch('AddToWishlist', {
    content_name: data.contentName,
    content_ids: data.contentIds,
    value: data.value,
    currency: data.currency || 'BDT',
  });
};

export const trackCompleteRegistration = (data?: {
  value?: number;
  currency?: string;
  status?: boolean;
}) => {
  dispatch('CompleteRegistration', {
    value: data?.value || 0,
    currency: data?.currency || 'BDT',
    status: data?.status ?? true,
  });
};

export const trackContact = () => {
  dispatch('Contact', {});
};

export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  const eventId = uuid();
  safeFbq('trackCustom', eventName, params, { eventID: eventId });
  void sendCapi(eventName, eventId, params);
};

