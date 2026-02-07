/**
 * Optimized Inventory Hook
 * Server-side pagination and selective fetching for inventory management
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePagination, useDebounce, QUERY_CONFIG } from "@/utils/performance";
import type { InventoryTransaction } from "./useInventory";

interface InventoryVariant {
  id: string;
  sku: string;
  stock: number;
  available_stock: number;
  reserved_stock: number;
  selling_price: number;
  purchase_price: number;
  is_active: boolean;
  product: {
    id: string;
    name: string;
  } | null;
  color: { id: string; name: string } | null;
  size: { id: string; label: string } | null;
  material: { id: string; name: string } | null;
}

interface UseOptimizedInventoryResult {
  variants: InventoryVariant[];
  isLoading: boolean;
  error: Error | null;
  pagination: ReturnType<typeof usePagination>;
  totalCount: number;
}

export const useOptimizedInventory = (
  search?: string,
  lowStockOnly = false
): UseOptimizedInventoryResult => {
  const pagination = usePagination(50);
  const debouncedSearch = useDebounce(search, 300);

  const queryKey = [
    "inventory-optimized",
    debouncedSearch,
    lowStockOnly,
    pagination.page,
    pagination.pageSize,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("product_variants")
        .select(`
          id,
          sku,
          stock,
          available_stock,
          reserved_stock,
          selling_price,
          purchase_price,
          is_active,
          product:products(id, name),
          color:colors(id, name),
          size:sizes(id, label),
          material:materials(id, name)
        `)
        .eq("is_active", true)
        .order("stock", { ascending: true })
        .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

      let countQuery = supabase
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (lowStockOnly) {
        query = query.lt("stock", 10);
        countQuery = countQuery.lt("stock", 10);
      }

      if (debouncedSearch) {
        query = query.ilike("sku", `%${debouncedSearch}%`);
        countQuery = countQuery.ilike("sku", `%${debouncedSearch}%`);
      }

      const [dataResult, countResult] = await Promise.all([query, countQuery]);

      if (dataResult.error) throw dataResult.error;

      return {
        variants: dataResult.data as InventoryVariant[],
        totalCount: countResult.count || 0,
      };
    },
    ...QUERY_CONFIG.listView,
  });

  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    variants: data?.variants || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};

// Optimized low stock alerts with threshold support
export const useOptimizedLowStockAlerts = (threshold = 5) => {
  return useQuery({
    queryKey: ["low-stock-alerts-optimized", threshold],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("product_variants")
        .select(`
          id,
          sku,
          stock,
          selling_price,
          product:products(id, name),
          color:colors(id, name),
          size:sizes(id, label)
        `, { count: "exact" })
        .eq("is_active", true)
        .lte("stock", threshold)
        .order("stock", { ascending: true })
        .limit(50);

      if (error) throw error;

      return {
        items: data as InventoryVariant[],
        totalCount: count || 0,
        criticalCount: data?.filter(v => v.stock === 0).length || 0,
        warningCount: data?.filter(v => v.stock > 0 && v.stock <= threshold).length || 0,
      };
    },
    ...QUERY_CONFIG.liveData,
  });
};

// Optimized transaction ledger with pagination
export const useOptimizedInventoryLedger = (
  variantId?: string | null,
  transactionType?: InventoryTransaction["transaction_type"]
) => {
  const pagination = usePagination(50);

  const queryKey = [
    "inventory-ledger-optimized",
    variantId,
    transactionType,
    pagination.page,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("inventory_transactions")
        .select(`
          id,
          variant_id,
          transaction_type,
          quantity,
          available_stock_after,
          notes,
          created_at,
          order:orders(order_number),
          variant:product_variants(
            sku,
            product:products(name)
          )
        `)
        .order("created_at", { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

      let countQuery = supabase
        .from("inventory_transactions")
        .select("id", { count: "exact", head: true });

      if (variantId) {
        query = query.eq("variant_id", variantId);
        countQuery = countQuery.eq("variant_id", variantId);
      }

      if (transactionType) {
        query = query.eq("transaction_type", transactionType);
        countQuery = countQuery.eq("transaction_type", transactionType);
      }

      const [dataResult, countResult] = await Promise.all([query, countQuery]);

      if (dataResult.error) throw dataResult.error;

      return {
        transactions: dataResult.data as InventoryTransaction[],
        totalCount: countResult.count || 0,
      };
    },
    ...QUERY_CONFIG.listView,
  });

  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    transactions: data?.transactions || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};

// Inventory stats for dashboard
export const useInventoryStats = () => {
  return useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const [
        totalVariantsResult,
        outOfStockResult,
        lowStockResult,
        totalValueResult,
      ] = await Promise.all([
        supabase
          .from("product_variants")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("product_variants")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .eq("stock", 0),
        supabase
          .from("product_variants")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true)
          .gt("stock", 0)
          .lte("stock", 5),
        supabase
          .from("product_variants")
          .select("stock, selling_price")
          .eq("is_active", true),
      ]);

      const totalValue = (totalValueResult.data || [])
        .reduce((sum, v) => sum + (v.stock * v.selling_price), 0);

      return {
        totalVariants: totalVariantsResult.count || 0,
        outOfStock: outOfStockResult.count || 0,
        lowStock: lowStockResult.count || 0,
        totalValue,
      };
    },
    ...QUERY_CONFIG.liveData,
  });
};
