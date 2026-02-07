/**
 * Optimized Products Hook
 * Server-side pagination and selective fetching for product management
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePagination, useDebounce, QUERY_CONFIG } from "@/utils/performance";
import type { Product } from "@/types/product";

interface UseOptimizedProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  pagination: ReturnType<typeof usePagination>;
  totalCount: number;
}

export const useOptimizedProducts = (
  search?: string,
  categoryId?: string,
  activeOnly = false
): UseOptimizedProductsResult => {
  const pagination = usePagination(50);
  const debouncedSearch = useDebounce(search, 300);

  const queryKey = [
    "products-optimized",
    debouncedSearch,
    categoryId,
    activeOnly,
    pagination.page,
    pagination.pageSize,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // Slim query - only essential fields for list view
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          product_type,
          base_price,
          is_active,
          created_at,
          category:categories(id, name),
          brand:brands(id, name),
          images:product_images(id, image_url, is_main, sort_order)
        `)
        .order("created_at", { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.pageSize - 1);

      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (debouncedSearch) {
        const searchFilter = `name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`;
        query = query.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
        countQuery = countQuery.eq("category_id", categoryId);
      }

      if (activeOnly) {
        query = query.eq("is_active", true);
        countQuery = countQuery.eq("is_active", true);
      }

      const [dataResult, countResult] = await Promise.all([query, countQuery]);

      if (dataResult.error) throw dataResult.error;

      return {
        products: dataResult.data as Product[],
        totalCount: countResult.count || 0,
      };
    },
    ...QUERY_CONFIG.listView,
  });

  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    products: data?.products || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount: data?.totalCount || 0,
  };
};

// Optimized category products for storefront with "Load More" pattern
export const useOptimizedCategoryProducts = (
  categorySlug?: string,
  sortBy: "newest" | "price_asc" | "price_desc" = "newest"
) => {
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const queryKey = [
    "category-products-optimized",
    categorySlug,
    sortBy,
    page,
  ];

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const offset = (page - 1) * PAGE_SIZE;
      
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          created_at,
          category:categories(id, name),
          images:product_images(id, image_url, is_main),
          variants:product_variants(id, selling_price, stock)
        `)
        .eq("is_active", true);

      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Filter by category if not "all"
      if (categorySlug && categorySlug !== "all") {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .ilike("name", categorySlug.replace(/-/g, " "))
          .single();

        if (categoryData) {
          query = query.eq("category_id", categoryData.id);
          countQuery = countQuery.eq("category_id", categoryData.id);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case "price_asc":
          query = query.order("base_price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("base_price", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      query = query.range(offset, offset + PAGE_SIZE - 1);

      const [dataResult, countResult] = await Promise.all([query, countQuery]);

      if (dataResult.error) throw dataResult.error;

      return {
        products: dataResult.data as Product[],
        totalCount: countResult.count || 0,
        currentPage: page,
      };
    },
    ...QUERY_CONFIG.listView,
  });

  // Accumulate products when new page loads
  useEffect(() => {
    if (data?.products) {
      if (data.currentPage === 1) {
        setAllProducts(data.products);
      } else {
        setAllProducts(prev => {
          // Avoid duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = data.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
      setTotalCount(data.totalCount);
    }
  }, [data]);

  // Reset when category or sort changes
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
  }, [categorySlug, sortBy]);

  const loadMore = () => {
    if (!isFetching && allProducts.length < totalCount) {
      setPage(prev => prev + 1);
    }
  };

  const hasMore = allProducts.length < totalCount;

  return {
    products: allProducts,
    isLoading: isLoading && page === 1,
    isLoadingMore: isFetching && page > 1,
    error: error as Error | null,
    totalCount,
    hasMore,
    loadMore,
    // Keep pagination for backwards compatibility
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      hasNextPage: hasMore,
      hasPrevPage: page > 1,
      nextPage: loadMore,
      prevPage: () => {},
      setTotalCount: () => {},
      totalCount,
      offset: (page - 1) * PAGE_SIZE,
    },
  };
};

// Product stats for dashboard
export const useProductStats = () => {
  return useQuery({
    queryKey: ["product-stats"],
    queryFn: async () => {
      const [
        totalProductsResult,
        activeProductsResult,
        totalVariantsResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("product_variants")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true }),
      ]);

      return {
        totalProducts: totalProductsResult.count || 0,
        activeProducts: activeProductsResult.count || 0,
        totalVariants: totalVariantsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
      };
    },
    ...QUERY_CONFIG.referenceData,
  });
};
