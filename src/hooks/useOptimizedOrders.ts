/**
 * Optimized Orders Hook
 * Wraps existing useOrders with server-side pagination, caching, and selective fetching
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePagination, useDebounce, QUERY_CONFIG, SLIM_COLUMNS } from "@/utils/performance";
import { orderFilterSchema, validateSafe } from "@/utils/validation-schemas";
import type { Order, OrderStatus, PaymentStatus } from "./useOrders";

interface OptimizedOrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface UseOptimizedOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  pagination: ReturnType<typeof usePagination>;
  totalCount: number;
}

export const useOptimizedOrders = (
  filters: OptimizedOrderFilters = {}
): UseOptimizedOrdersResult => {
  const pagination = usePagination(50);
  
  // Debounce search to prevent rapid-fire queries
  const debouncedSearch = useDebounce(filters.search, 300);

  // Validate filters
  const validatedFilters = validateSafe(orderFilterSchema, {
    ...filters,
    query: debouncedSearch,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  const queryKey = [
    "orders-optimized",
    filters.status,
    filters.paymentStatus,
    debouncedSearch,
    filters.dateFrom,
    filters.dateTo,
    pagination.page,
    pagination.pageSize,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // First, get total count for pagination
      let countQuery = supabase
        .from("orders")
        .select("id", { count: "exact", head: true });

      // Build the main query with selective columns (slim query)
      let query = supabase
        .from("orders")
        .select(SLIM_COLUMNS.ordersList)
        .order("created_at", { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

      // Apply filters to both queries
      if (filters.status) {
        query = query.eq("order_status", filters.status);
        countQuery = countQuery.eq("order_status", filters.status);
      }
      if (filters.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
        countQuery = countQuery.eq("payment_status", filters.paymentStatus);
      }
      if (debouncedSearch) {
        const searchFilter = `order_number.ilike.%${debouncedSearch}%,shipping_name.ilike.%${debouncedSearch}%,shipping_phone.ilike.%${debouncedSearch}%`;
        query = query.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
        countQuery = countQuery.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
        countQuery = countQuery.lte("created_at", filters.dateTo);
      }

      // Execute both queries in parallel
      const [dataResult, countResult] = await Promise.all([
        query,
        countQuery,
      ]);

      if (dataResult.error) throw dataResult.error;
      if (countResult.error) throw countResult.error;

      return {
        orders: dataResult.data as Order[],
        totalCount: countResult.count || 0,
      };
    },
    ...QUERY_CONFIG.listView,
    enabled: validatedFilters.success,
  });

  // Update pagination total count when data changes
  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    orders: data?.orders || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};

// Optimized verification queue with live updates
export const useOptimizedVerificationQueue = () => {
  const pagination = usePagination(25);

  const { data, isLoading, error } = useQuery({
    queryKey: ["verification-queue-optimized", pagination.page],
    queryFn: async () => {
      const [dataResult, countResult] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            id,
            order_number,
            payment_method_type,
            transaction_id,
            sender_number,
            payment_proof_url,
            total_amount,
            shipping_name,
            shipping_phone,
            created_at,
            payment_method:payment_methods(id, name, type)
          `)
          .eq("payment_status", "pending_verification")
          .order("created_at", { ascending: true })
          .range(pagination.offset, pagination.offset + pagination.pageSize - 1),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "pending_verification"),
      ]);

      if (dataResult.error) throw dataResult.error;
      
      return {
        orders: dataResult.data as Order[],
        totalCount: countResult.count || 0,
      };
    },
    ...QUERY_CONFIG.liveData,
  });

  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    orders: data?.orders || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};

// Optimized order stats with caching
export const useOptimizedOrderStats = () => {
  return useQuery({
    queryKey: ["order-stats-optimized"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Execute aggregation queries in parallel
      const [
        todayOrdersResult,
        pendingVerificationResult,
        pendingFulfillmentResult,
        totalRevenueResult,
      ] = await Promise.all([
        // Today's orders with revenue
        supabase
          .from("orders")
          .select("id, total_amount, payment_status")
          .gte("created_at", todayISO),
        // Pending verification count
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("payment_status", "pending_verification"),
        // Pending fulfillment count
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("order_status", ["confirmed", "processing"]),
        // Total revenue (paid orders)
        supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "paid"),
      ]);

      const todayOrders = todayOrdersResult.data || [];
      const todayRevenue = todayOrders
        .filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      const totalRevenue = (totalRevenueResult.data || [])
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      return {
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingVerification: pendingVerificationResult.count || 0,
        pendingFulfillment: pendingFulfillmentResult.count || 0,
        totalRevenue,
      };
    },
    ...QUERY_CONFIG.liveData,
  });
};
