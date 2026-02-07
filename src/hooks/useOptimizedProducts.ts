/**
 * Optimized Products Hook
 * Server-side pagination and selective fetching for product management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce, QUERY_CONFIG } from "@/utils/performance";
import type { Product } from "@/types/product";

interface PaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  offset: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

interface UseOptimizedProductsResult {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationResult;
  totalCount: number;
}

export const useOptimizedProducts = (
  search?: string,
  categoryId?: string,
  activeOnly = false
): UseOptimizedProductsResult => {
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const debouncedSearch = useDebounce(search, 300);
  
  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, activeOnly]);

  const offset = (page - 1) * pageSize;

  const queryKey = [
    "products-optimized",
    debouncedSearch,
    categoryId,
    activeOnly,
    page,
    pageSize,
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
        .range(offset, offset + pageSize - 1);

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

  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1);
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1);
  }, [page]);

  const setPageNum = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  }, [totalPages]);

  const pagination: PaginationResult = {
    page,
    pageSize,
    totalPages,
    totalCount,
    offset,
    nextPage,
    prevPage,
    setPage: setPageNum,
  };

  return {
    products: data?.products || [],
    isLoading,
    error: error as Error | null,
    pagination,
    totalCount,
  };
};

// Optimized category products for storefront with "Load More" pattern
export const useOptimizedCategoryProducts = (
  categorySlug?: string,
  sortBy: "newest" | "price_asc" | "price_desc" = "newest"
) => {
  const PAGE_SIZE = 12;
  const categoryIdRef = useRef<string | null>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["category-products-infinite", categorySlug, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;
      
      let query = supabase
        .from("products")
        .select(`
          id,
          name,
          base_price,
          created_at,
          category:categories(id, name),
          images:product_images(id, image_url, is_main),
          variants:product_variants(id, selling_price, is_active)
        `)
        .eq("is_active", true);

      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      // Filter by category if not "all"
      if (categorySlug && categorySlug !== "all") {
        // Cache category ID lookup
        if (!categoryIdRef.current) {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", categorySlug.replace(/-/g, " "))
            .single();
          categoryIdRef.current = categoryData?.id || null;
        }

        if (categoryIdRef.current) {
          query = query.eq("category_id", categoryIdRef.current);
          countQuery = countQuery.eq("category_id", categoryIdRef.current);
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
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.products.length, 0);
      if (totalLoaded < lastPage.totalCount) {
        return lastPage.nextPage;
      }
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  // Flatten all pages into single products array
  const products = data?.pages.flatMap(page => page.products) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    products,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    error: error as Error | null,
    totalCount,
    hasMore: hasNextPage ?? false,
    loadMore,
    // Keep pagination for backwards compatibility
    pagination: {
      page: data?.pages.length || 1,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
      hasNextPage: hasNextPage ?? false,
      hasPrevPage: false,
      nextPage: loadMore,
      prevPage: () => {},
      setTotalCount: () => {},
      totalCount,
      offset: 0,
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
