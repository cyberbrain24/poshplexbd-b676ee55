/**
 * Optimized Products Hook
 * Server-side pagination and selective fetching for product management
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce, QUERY_CONFIG } from "@/utils/performance";
import type { Product } from "@/types/product";
import type { ProductFilters } from "@/components/category/FilterSortBar";

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

// Parse price range string like "500-1000" or "2000-"
function parsePriceRange(range: string): { min: number; max: number | null } {
  const [minStr, maxStr] = range.split("-");
  return {
    min: parseInt(minStr, 10) || 0,
    max: maxStr === "" || maxStr === undefined ? null : parseInt(maxStr, 10),
  };
}

// Optimized category products for storefront with "Load More" pattern
export const useOptimizedCategoryProducts = (
  categorySlug?: string,
  sortBy: string = "newest",
  filters?: ProductFilters
) => {
  const PAGE_SIZE = 12;
  const categoryIdRef = useRef<string | null>(null);
  // Reset category ref when slug changes
  const prevSlug = useRef(categorySlug);
  if (prevSlug.current !== categorySlug) {
    categoryIdRef.current = null;
    prevSlug.current = categorySlug;
  }

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["category-products-infinite", categorySlug, sortBy, filters],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;
      
      // Determine which category IDs to filter by
      let categoryIds: string[] = [];

      if (categorySlug && categorySlug !== "all") {
        // Look up the parent category
        if (!categoryIdRef.current) {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", categorySlug.replace(/-/g, " "))
            .single();
          categoryIdRef.current = categoryData?.id || null;
        }

        if (categoryIdRef.current) {
          // If subcategory filters are active, use those; otherwise use parent
          if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
            categoryIds = filters.subcategoryIds;
          } else {
            // Include the parent category AND its subcategories
            const { data: subCats } = await supabase
              .from("categories")
              .select("id")
              .eq("parent_id", categoryIdRef.current);
            const subIds = subCats?.map((s) => s.id) || [];
            categoryIds = [categoryIdRef.current, ...subIds];
          }
        }
      } else if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
        categoryIds = filters.subcategoryIds;
      }

      // If color or size filters are active, we need to find matching product IDs via variants
      let variantFilteredProductIds: string[] | null = null;

      if (
        (filters?.colorIds && filters.colorIds.length > 0) ||
        (filters?.sizeIds && filters.sizeIds.length > 0)
      ) {
        let variantQuery = supabase
          .from("product_variants")
          .select("product_id")
          .eq("is_active", true);

        if (filters?.colorIds && filters.colorIds.length > 0) {
          variantQuery = variantQuery.in("color_id", filters.colorIds);
        }
        if (filters?.sizeIds && filters.sizeIds.length > 0) {
          variantQuery = variantQuery.in("size_id", filters.sizeIds);
        }

        const { data: variantData } = await variantQuery;
        variantFilteredProductIds = [
          ...new Set((variantData || []).map((v) => v.product_id)),
        ];

        // No matching products → return empty
        if (variantFilteredProductIds.length === 0) {
          return { products: [], totalCount: 0, nextPage: pageParam + 1 };
        }
      }

      // Build the main query
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

      // Apply category filter
      if (categoryIds.length > 0) {
        query = query.in("category_id", categoryIds);
        countQuery = countQuery.in("category_id", categoryIds);
      }

      // Apply variant-based product filter
      if (variantFilteredProductIds) {
        query = query.in("id", variantFilteredProductIds);
        countQuery = countQuery.in("id", variantFilteredProductIds);
      }

      // Apply price range filter
      if (filters?.priceRange) {
        const { min, max } = parsePriceRange(filters.priceRange);
        query = query.gte("base_price", min);
        countQuery = countQuery.gte("base_price", min);
        if (max !== null) {
          query = query.lte("base_price", max);
          countQuery = countQuery.lte("base_price", max);
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
        case "name_asc":
          query = query.order("name", { ascending: true });
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
    parentCategoryId: categoryIdRef.current,
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
