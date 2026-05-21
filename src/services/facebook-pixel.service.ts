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


// ─── Configuration ─────────────────────────────────────────────
export const setPixelConfig = (config: PixelConfig) => {
  _config = config;
};

export const getPixelConfig = () => _config;

/**
 * Set user data for Advanced Matching. Call after auth/login.
 * Pass plain values — Facebook SDK auto-hashes em/ph/fn/ln.
 * Re-inits the pixel with user data if already loaded.
 */
export const setAdvancedMatchingUser = (data: AdvancedMatchingUserData | null) => {
  _userData = data;
  if (_initialized && _config?.advancedMatching && _config.pixelId) {
    try {
      window.fbq('init', _config.pixelId, data || {});
      if (_config.testMode) console.log('[FB Pixel] Advanced Matching updated:', data);
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

/**
 * Send event to server-side Conversions API for browser+server deduplication.
 * Fired in parallel with fbq — Meta dedupes by (event_name, event_id).
 */
const sendCapi = async (
  eventName: string,
  eventId: string,
  customData?: Record<string, unknown>,
) => {
  try {
    // Lazy import to avoid pulling supabase client into critical render path
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

/**
 * Dispatch a standard pixel event with Browser+CAPI dedup.
 * Generates one event_id used by both the fbq call and the CAPI mirror.
 */
const dispatch = (eventName: string, params: Record<string, any>) => {
  const eventId = uuid();
  safeFbq('track', eventName, params, { eventID: eventId });
  // Fire CAPI in background (non-blocking)
  void sendCapi(eventName, eventId, params);
};

// ─── Standard Events ───────────────────────────────────────────

export const trackPageView = () => {
  // PageView is high-volume; only fire to CAPI when test mode is on or in prod
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

