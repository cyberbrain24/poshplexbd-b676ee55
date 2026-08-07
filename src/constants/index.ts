/**
 * Application Constants
 * Centralized magic strings and configuration values
 */

// ============================================================
// ORDER STATUS CONSTANTS
// ============================================================
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  PARTIALLY_DELIVERED: 'partially_delivered',
  RETURNED: 'returned',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  RTO: 'rto',
} as const;

export type OrderStatusType = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES];

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
  pending: 'Order Placed',
  confirmed: 'In Review',
  processing: 'Pending',
  shipped: 'Approval Pending',
  delivered: 'Delivered',
  partially_delivered: 'Partially Delivered',
  cancelled: 'Cancel',
  returned: 'Cancel',
  failed: 'Cancel',
  rto: 'Cancel',
};

/** Statuses exposed in admin dropdowns (in workflow order) */
export const ALLOWED_ORDER_STATUSES: OrderStatusType[] = [
  'pending',            // Order Placed
  'confirmed',          // In Review
  'processing',         // Pending
  'shipped',            // Approval Pending
  'delivered',          // Delivered
  'partially_delivered',// Partially Delivered
  'cancelled',          // Cancel
];

export const ORDER_STATUS_COLORS: Record<OrderStatusType, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  partially_delivered: 'bg-teal-100 text-teal-800',
  returned: 'bg-orange-100 text-orange-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  rto: 'bg-gray-100 text-gray-800',
};

// ============================================================
// PAYMENT STATUS CONSTANTS
// ============================================================
export const PAYMENT_STATUSES = {
  UNPAID: 'unpaid',
  PENDING_VERIFICATION: 'pending_verification',
  PAID: 'paid',
  PARTIALLY_PAID: 'partially_paid',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export type PaymentStatusType = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatusType, string> = {
  unpaid: 'Unpaid',
  pending_verification: 'Pending Verification',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  partially_refunded: 'Partially Refunded',
  refunded: 'Refunded',
  failed: 'Failed',
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatusType, string> = {
  unpaid: 'bg-red-100 text-red-800',
  pending_verification: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  partially_paid: 'bg-blue-100 text-blue-800',
  partially_refunded: 'bg-orange-100 text-orange-800',
  refunded: 'bg-gray-100 text-gray-800',
  failed: 'bg-red-100 text-red-800',
};

// ============================================================
// PAYMENT METHOD TYPES
// ============================================================
export const PAYMENT_METHOD_TYPES = {
  COD: 'cod',
  MOBILE_BANKING: 'mobile_banking',
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  ONLINE_GATEWAY: 'online_gateway',
} as const;

export type PaymentMethodTypeValue = typeof PAYMENT_METHOD_TYPES[keyof typeof PAYMENT_METHOD_TYPES];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodTypeValue, string> = {
  cod: 'Cash on Delivery',
  mobile_banking: 'Mobile Banking',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  online_gateway: 'Online Gateway',
};

// ============================================================
// FULFILLMENT STATUS CONSTANTS
// ============================================================
export const FULFILLMENT_STATUSES = {
  PENDING: 'pending',
  RESERVED: 'reserved',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  OUT_OF_STOCK: 'out_of_stock',
  RETURNED: 'returned',
  RETURN_PENDING: 'return_pending',
  DAMAGED: 'damaged',
  CANCELLED: 'cancelled',
} as const;

export type FulfillmentStatusType = typeof FULFILLMENT_STATUSES[keyof typeof FULFILLMENT_STATUSES];

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatusType, string> = {
  pending: 'Pending',
  reserved: 'Reserved',
  shipped: 'Shipped',
  delivered: 'Delivered',
  out_of_stock: 'Out of Stock',
  returned: 'Returned',
  return_pending: 'Return Pending',
  damaged: 'Damaged',
  cancelled: 'Cancelled',
};

// ============================================================
// TRANSACTION TYPES
// ============================================================
export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
} as const;

export type TransactionTypeValue = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

// ============================================================
// PRODUCT TYPES
// ============================================================
export const PRODUCT_TYPES = {
  SIMPLE: 'simple',
  VARIABLE: 'variable',
} as const;

export type ProductTypeValue = typeof PRODUCT_TYPES[keyof typeof PRODUCT_TYPES];

// ============================================================
// RISK LEVELS
// ============================================================
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type RiskLevelType = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

export const RISK_LEVEL_COLORS: Record<RiskLevelType, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

// ============================================================
// PAGINATION DEFAULTS
// ============================================================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 10,
  /** Hard safety cap for all list queries to prevent full-table scans */
  HARD_CAP: 100,
} as const;

// ============================================================
// DEBOUNCE TIMINGS
// ============================================================
export const DEBOUNCE = {
  SEARCH: 300,
  NAVIGATION: 150,
  INPUT: 200,
} as const;

// ============================================================
// CACHE TIMINGS (milliseconds)
// ============================================================
export const CACHE = {
  STALE_TIME: 1000 * 60 * 5, // 5 minutes
  GC_TIME: 1000 * 60 * 30, // 30 minutes
  REFETCH_INTERVAL: 1000 * 60, // 1 minute
} as const;

// ============================================================
// API & STORAGE
// ============================================================
export const STORAGE = {
  PRODUCT_IMAGES_BUCKET: 'product-images',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

// ============================================================
// ORDER NUMBER FORMAT
// ============================================================
export const ORDER_NUMBER_PREFIX = 'PO-';

// ============================================================
// ROUTES
// ============================================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  AUTH: '/auth',
  CHECKOUT: '/checkout',
  ORDER_TRACKING: '/order-tracking',
  MY_ORDERS: '/my-orders',
  ACCOUNT: '/account',
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    CUSTOMERS: '/admin/customers',
    ACCOUNTS: '/admin/accounts',
    SEO: '/admin/seo',
  },
} as const;
