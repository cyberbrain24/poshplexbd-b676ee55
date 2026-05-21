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

// ─── Script Injection (Singleton, Lazy) ────────────────────────
const injectScript = () => {
  if (_scriptInjected) return;
  if (!_config?.isEnabled || !_config?.pixelId) return;

  // Environment gate: only run in production OR if test_mode is on
  const isProd = import.meta.env.PROD;
  if (!isProd && !_config.testMode) return;

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

  // Initialize pixel
  if (_config.advancedMatching) {
    window.fbq('init', _config.pixelId, {});
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

// ─── Standard Events ───────────────────────────────────────────

export const trackPageView = () => {
  safeFbq('track', 'PageView');
};

export const trackViewContent = (data: {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
}) => {
  safeFbq('track', 'ViewContent', {
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
  safeFbq('track', 'AddToCart', {
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
  safeFbq('track', 'InitiateCheckout', {
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
  safeFbq('track', 'Purchase', {
    content_ids: data.contentIds,
    value: data.value,
    currency: data.currency || 'BDT',
    num_items: data.numItems,
    order_id: data.orderId,
  });
};

export const trackSearch = (searchString: string) => {
  safeFbq('track', 'Search', { search_string: searchString });
};

export const trackAddToWishlist = (data: {
  contentName: string;
  contentIds: string[];
  value: number;
  currency?: string;
}) => {
  safeFbq('track', 'AddToWishlist', {
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
  safeFbq('track', 'CompleteRegistration', {
    value: data?.value || 0,
    currency: data?.currency || 'BDT',
    status: data?.status ?? true,
  });
};

export const trackContact = () => {
  safeFbq('track', 'Contact');
};

export const trackCustomEvent = (eventName: string, params?: Record<string, any>) => {
  safeFbq('trackCustom', eventName, params);
};
