/**
 * Query helper utilities for React Query and Supabase
 * Centralized query key management and invalidation patterns
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized query keys for consistent cache management
 * Using array syntax for granular invalidation
 */
export const QUERY_KEYS = {
  // Orders domain
  orders: {
    all: ["orders"] as const,
    list: (filters?: Record<string, unknown>) => ["orders", filters] as const,
    detail: (id: string) => ["order", id] as const,
    history: (id: string) => ["order-history", id] as const,
    stats: ["order-stats"] as const,
    optimized: ["orders-optimized"] as const,
  },
  
  // Products domain
  products: {
    all: ["products"] as const,
    list: (limit?: number) => ["products-list", limit] as const,
    detail: (id: string) => ["product", id] as const,
    count: ["products-count"] as const,
    optimized: ["products-optimized"] as const,
    stats: ["product-stats"] as const,
    category: (slug: string, sort: string) => ["category-products-infinite", slug, sort] as const,
  },
  
  // Customers domain
  customers: {
    all: ["customers"] as const,
    list: (filters?: Record<string, unknown>) => ["customers", filters] as const,
    detail: (id: string) => ["customer", id] as const,
  },
  
  // Accounts & Transactions domain
  accounts: {
    all: ["accounts"] as const,
    detail: (id: string) => ["account", id] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filters?: Record<string, unknown>) => ["transactions", filters] as const,
    categories: (type?: string) => ["transaction-categories", type] as const,
  },
  
  // Payments domain
  payments: {
    methods: ["payment-methods"] as const,
    methodsAdmin: ["payment-methods-admin"] as const,
    orderPayments: (orderId: string) => ["order-payments", orderId] as const,
  },
  
  // Location domain
  locations: {
    divisions: ["divisions"] as const,
    divisionsPublic: ["divisions-public"] as const,
    thanas: (divisionId?: string) => ["thanas", divisionId] as const,
    thanasPublic: (divisionId?: string) => ["thanas-public", divisionId] as const,
  },
  
  // Master data domain
  masterData: {
    colors: ["colors"] as const,
    sizes: ["sizes"] as const,
    materials: ["materials"] as const,
    categories: ["categories"] as const,
    brands: ["brands"] as const,
    sizeGuides: ["sizeGuides"] as const,
    careInstructions: ["careInstructions"] as const,
    customerTypes: ["customerTypes"] as const,
  },
  
  // Shipping domain
  shipping: {
    steadfastBalance: ["steadfast-balance"] as const,
    steadfastTrack: (code: string) => ["steadfast-track", code] as const,
    steadfastTrackInvoice: (invoice: string) => ["steadfast-track-invoice", invoice] as const,
  },
  
} as const;

/**
 * Batch invalidate related queries after mutations
 * Reduces boilerplate in mutation callbacks
 */
export function invalidateOrderQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.all });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.stats });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orders.optimized });
}

export function invalidateProductQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.all });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.count });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.optimized });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products.stats });
}

export function invalidateCustomerQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
}

export function invalidateAccountQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accounts.all });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions.all });
}

export function invalidatePaymentQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.methods });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.methodsAdmin });
}

/**
 * Standard error handler for mutations
 * Consistent error logging and user feedback
 */
export function handleMutationError(error: Error, operation: string): void {
  console.error(`[${operation}] Error:`, error.message);
}
