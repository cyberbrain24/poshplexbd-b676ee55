/**
 * Meta Pixel tracking utility – lightweight, toggle-controlled, fail-silent.
 * All public functions catch errors internally so they never block the UI.
 */

import { supabase } from "@/integrations/supabase/client";

// --------------- types ---------------
interface MetaConfig {
  pixelId: string | null;
  pixelEnabled: boolean;
  ecommerceEnabled: boolean;
  capiEnabled: boolean;
}

interface ContentItem {
  id: string;
  quantity?: number;
  item_price?: number;
}

// --------------- state ---------------
let _config: MetaConfig | null = null;
let _configPromise: Promise<MetaConfig> | null = null;
const _firedEvents = new Set<string>();

// --------------- helpers ---------------
const fbq = (...args: unknown[]) => {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq(...args);
    }
  } catch {
    /* fail silently */
  }
};

/** Generate a unique event ID for deduplication */
export const generateEventId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/** Load pixel config from DB (cached) */
export const getMetaConfig = async (): Promise<MetaConfig> => {
  if (_config) return _config;
  if (_configPromise) return _configPromise;

  _configPromise = (async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("meta_pixel_id, meta_pixel_enabled, meta_ecommerce_events_enabled, meta_capi_enabled")
        .limit(1)
        .maybeSingle();

      _config = {
        pixelId: data?.meta_pixel_id ?? null,
        pixelEnabled: data?.meta_pixel_enabled ?? false,
        ecommerceEnabled: data?.meta_ecommerce_events_enabled ?? false,
        capiEnabled: data?.meta_capi_enabled ?? false,
      };
    } catch {
      _config = { pixelId: null, pixelEnabled: false, ecommerceEnabled: false, capiEnabled: false };
    }
    return _config!;
  })();

  return _configPromise;
};

/** Invalidate cached config (call after admin saves settings) */
export const invalidateMetaConfig = () => {
  _config = null;
  _configPromise = null;
};

/** Log tracking event to DB (fire-and-forget) */
const logEvent = (eventType: string, status: "success" | "failed" = "success", metadata?: Record<string, unknown>) => {
  try {
    supabase
      .from("tracking_events")
      .insert([{ event_type: eventType, status, metadata: (metadata ?? {}) as any }])
      .then(() => {});
  } catch {
    /* fail silently */
  }
};

// --------------- pixel injection ---------------
let _injected = false;

export const injectMetaPixel = async () => {
  if (_injected) return;
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.pixelId) return;

    // Prevent duplicate injection
    if (document.querySelector(`script[data-meta-pixel]`)) return;

    const script = document.createElement("script");
    script.dataset.metaPixel = "true";
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${cfg.pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
    _injected = true;
    logEvent("PageView");
  } catch {
    /* fail silently */
  }
};

export const removeMetaPixel = () => {
  try {
    document.querySelectorAll("[data-meta-pixel]").forEach((el) => el.remove());
    _injected = false;
    _firedEvents.clear();
  } catch {
    /* fail silently */
  }
};

// --------------- event helpers ---------------

/** Track PageView (already fired on init, but can re-fire on SPA navigation) */
export const trackPageView = async () => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.pixelId) return;
    fbq("track", "PageView");
    logEvent("PageView");
  } catch { /* */ }
};

/** ViewContent – Product page */
export const trackViewContent = async (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  currency?: string;
}) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    const key = `ViewContent-${product.id}`;
    if (_firedEvents.has(key)) return;
    _firedEvents.add(key);

    fbq("track", "ViewContent", {
      content_ids: [product.id],
      content_name: product.name,
      content_type: "product",
      content_category: product.category || "",
      value: product.price,
      currency: product.currency || "BDT",
    });
    logEvent("ViewContent", "success", { product_id: product.id });
  } catch { /* */ }
};

/** ViewCategory – Category page */
export const trackViewCategory = async (category: { name: string; slug: string }) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    const key = `ViewCategory-${category.slug}`;
    if (_firedEvents.has(key)) return;
    _firedEvents.add(key);

    fbq("track", "ViewContent", {
      content_type: "product_group",
      content_category: category.name,
    });
    logEvent("ViewCategory", "success", { category: category.name });
  } catch { /* */ }
};

/** Search */
export const trackSearch = async (query: string) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    fbq("track", "Search", { search_string: query });
    logEvent("Search", "success", { query });
  } catch { /* */ }
};

/** AddToCart – after confirmed cart addition */
export const trackAddToCart = async (item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  currency?: string;
}) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    fbq("track", "AddToCart", {
      content_ids: [item.id],
      content_name: item.name,
      content_type: "product",
      value: item.price * item.quantity,
      currency: item.currency || "BDT",
      contents: [{ id: item.id, quantity: item.quantity, item_price: item.price }],
    });
    logEvent("AddToCart", "success", { product_id: item.id, quantity: item.quantity });
  } catch { /* */ }
};

/** InitiateCheckout */
export const trackInitiateCheckout = async (items: {
  ids: string[];
  value: number;
  numItems: number;
  currency?: string;
}) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    const key = "InitiateCheckout";
    if (_firedEvents.has(key)) return;
    _firedEvents.add(key);

    fbq("track", "InitiateCheckout", {
      content_ids: items.ids,
      content_type: "product",
      value: items.value,
      currency: items.currency || "BDT",
      num_items: items.numItems,
    });
    logEvent("InitiateCheckout", "success", { num_items: items.numItems, value: items.value });
  } catch { /* */ }
};

/** AddPaymentInfo */
export const trackAddPaymentInfo = async (paymentMethod: string, value: number, currency?: string) => {
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return;

    const key = "AddPaymentInfo";
    if (_firedEvents.has(key)) return;
    _firedEvents.add(key);

    fbq("track", "AddPaymentInfo", {
      content_category: paymentMethod,
      value,
      currency: currency || "BDT",
    });
    logEvent("AddPaymentInfo", "success", { payment_method: paymentMethod });
  } catch { /* */ }
};

/** Purchase – with unique event_id for dedup with CAPI */
export const trackPurchase = async (order: {
  orderId: string;
  orderNumber: string;
  value: number;
  items: ContentItem[];
  currency?: string;
}): Promise<string> => {
  const eventId = generateEventId();
  try {
    const cfg = await getMetaConfig();
    if (!cfg.pixelEnabled || !cfg.ecommerceEnabled) return eventId;

    const key = `Purchase-${order.orderId}`;
    if (_firedEvents.has(key)) return eventId;
    _firedEvents.add(key);

    fbq("track", "Purchase", {
      content_ids: order.items.map((i) => i.id),
      content_type: "product",
      value: order.value,
      currency: order.currency || "BDT",
      num_items: order.items.length,
      contents: order.items,
      order_id: order.orderNumber,
      event_id: eventId,
    });
    logEvent("Purchase", "success", { order_id: order.orderId, event_id: eventId, value: order.value });

    // Fire CAPI if enabled (async, non-blocking)
    if (cfg.capiEnabled) {
      sendCAPIPurchase(order, eventId).catch(() => {});
    }
  } catch { /* */ }
  return eventId;
};

/** Clear dedup cache (e.g. on route change) */
export const clearEventDedup = () => {
  _firedEvents.clear();
};

// --------------- Server-side CAPI ---------------
const sendCAPIPurchase = async (
  order: { orderId: string; orderNumber: string; value: number; items: ContentItem[]; currency?: string },
  eventId: string
) => {
  try {
    await supabase.functions.invoke("meta-capi", {
      body: {
        event_name: "Purchase",
        event_id: eventId,
        order_id: order.orderId,
        order_number: order.orderNumber,
        value: order.value,
        currency: order.currency || "BDT",
        contents: order.items,
      },
    });
    logEvent("CAPI_Purchase", "success", { order_id: order.orderId, event_id: eventId });
  } catch {
    logEvent("CAPI_Purchase", "failed", { order_id: order.orderId, event_id: eventId });
  }
};
