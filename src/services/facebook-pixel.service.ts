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
      // Normalize Bangladesh numbers to E.164 (without leading "+") per Meta spec.
      // Examples: "01712345678" -> "8801712345678", "+8801712345678" -> "8801712345678".
      let digits = String(data.ph).replace(/\D/g, '');
      if (digits.startsWith('00')) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith('01')) digits = '880' + digits.slice(1);
      else if (digits.length === 10 && digits.startsWith('1')) digits = '880' + digits;
      if (digits.length >= 10 && digits.length <= 15) clean.ph = digits;
    }
    if (data.fn && String(data.fn).trim()) clean.fn = String(data.fn).trim();
    if (data.ln && String(data.ln).trim()) clean.ln = String(data.ln).trim();
    if (data.ct && String(data.ct).trim()) clean.ct = String(data.ct).trim();
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

  // Inject the script tag
  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
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
) => {
  // Defer to idle time so CAPI never competes with the initial paint
  // or critical data fetches for HTTP connections.
  const run = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const userData = {
        ..._userData,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc'),
      };
      await supabase.functions.invoke('meta-capi', {
        body: {
          event_name: eventName,
          event_id: eventId,
          event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          user_data: userData,
          custom_data: customData,
          action_source: 'website',
        },
      });
    } catch {
      // Silently fail — CAPI is enhancement, not critical
    }
  };
  if (typeof window === 'undefined') return;
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

export const trackPageView = () => {
  // Always mirror PageView to CAPI for full event coverage (≥75% target).
  // sendCapi is already deferred via requestIdleCallback, so it never
  // competes with the homepage critical path.
  const eventId = uuid();
  safeFbq('track', 'PageView', undefined, { eventID: eventId });
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
  dispatch('Purchase', {
    content_ids: data.contentIds,
    value: data.value,
    currency: data.currency || 'BDT',
    num_items: data.numItems,
    order_id: data.orderId,
  });
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

