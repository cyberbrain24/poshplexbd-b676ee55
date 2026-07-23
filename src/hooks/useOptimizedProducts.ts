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
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([]);
  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 300);
  
  useEffect(() => {
    setPage(1);
    setAccumulatedProducts([]);
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
          is_featured,
          created_at,
          category:categories(id, name),
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

  // Accumulate products across pages
  useEffect(() => {
    if (data?.products) {
      if (page === 1) {
        setAccumulatedProducts(data.products);
      } else {
        setAccumulatedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = data.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    }
  }, [data, page]);

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
    products: accumulatedProducts,
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

// Resolve a category slug to the set of product IDs it contains.
// Cached separately so infinite-scroll pages don't re-run these lookups.
const useCategoryProductIds = (
  categorySlug: string | undefined,
  filters?: ProductFilters,
) => {
  return useQuery({
    queryKey: [
      "category-resolve",
      categorySlug,
      filters?.subcategoryIds,
      filters?.colorIds,
      filters?.sizeIds,
    ],
    queryFn: async () => {
      let categoryIds: string[] = [];
      let parentCategoryId: string | null = null;

      if (categorySlug && categorySlug !== "all") {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id, is_active")
          .ilike("name", categorySlug.replace(/-/g, " "))
          .is("parent_id", null)
          .limit(1)
          .maybeSingle();

        if (!categoryData || categoryData.is_active === false) {
          return { productIds: [] as string[], parentCategoryId: null, empty: true };
        }
        parentCategoryId = categoryData.id;

        if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
          categoryIds = filters.subcategoryIds;
        } else {
          const { data: subCats } = await supabase
            .from("categories")
            .select("id")
            .eq("parent_id", parentCategoryId)
            .eq("is_active", true);
          categoryIds = [parentCategoryId, ...(subCats?.map((s) => s.id) || [])];
        }
      } else if (filters?.subcategoryIds && filters.subcategoryIds.length > 0) {
        categoryIds = filters.subcategoryIds;
      } else {
        const { data: activeCats } = await supabase
          .from("categories")
          .select("id")
          .eq("is_active", true);
        categoryIds = (activeCats || []).map((c) => c.id);
      }

      // Junction + variant filters in parallel
      const junctionPromise = categoryIds.length
        ? supabase
            .from("product_categories")
            .select("product_id")
            .in("category_id", categoryIds)
        : Promise.resolve({ data: [] as { product_id: string }[] });

      const needsVariantFilter =
        (filters?.colorIds && filters.colorIds.length > 0) ||
        (filters?.sizeIds && filters.sizeIds.length > 0);

      let variantPromise:
        | Promise<{ data: { product_id: string }[] | null }>
        | null = null;
      if (needsVariantFilter) {
        let vq = supabase
          .from("product_variants")
          .select("product_id")
          .eq("is_active", true);
        if (filters?.colorIds?.length) vq = vq.in("color_id", filters.colorIds);
        if (filters?.sizeIds?.length) vq = vq.in("size_id", filters.sizeIds);
        variantPromise = vq as unknown as Promise<{
          data: { product_id: string }[] | null;
        }>;
      }

      const [junctionRes, variantRes] = await Promise.all([
        junctionPromise,
        variantPromise ?? Promise.resolve(null),
      ]);

      const catIds = new Set(
        (junctionRes.data || []).map((r) => r.product_id),
      );
      let productIds = [...catIds];

      if (variantRes) {
        const vIds = new Set((variantRes.data || []).map((r) => r.product_id));
        productIds = productIds.filter((id) => vIds.has(id));
      }

      return {
        productIds,
        parentCategoryId,
        empty: productIds.length === 0,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

// Optimized category products for storefront with "Load More" pattern
export const useOptimizedCategoryProducts = (
  categorySlug?: string,
  sortBy: string = "newest",
  filters?: ProductFilters
) => {
  const PAGE_SIZE = 12;

  const {
    data: resolved,
    isLoading: isResolving,
  } = useCategoryProductIds(categorySlug, filters);

  const productIds = resolved?.productIds;
  const isEmpty = resolved?.empty === true;

  const {
    data,
    isLoading: isLoadingPages,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "category-products-infinite",
      categorySlug,
      sortBy,
      filters?.priceRange,
      productIds,
    ],
    enabled: !!resolved && !isEmpty,
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
          images:product_images(id, image_url, thumb_url, medium_url, large_url, is_main)
        `)
        .eq("is_active", true);

      let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);

      if (productIds && productIds.length > 0) {
        query = query.in("id", productIds);
        countQuery = countQuery.in("id", productIds);
      }

      if (filters?.priceRange) {
        const { min, max } = parsePriceRange(filters.priceRange);
        query = query.gte("base_price", min);
        countQuery = countQuery.gte("base_price", min);
        if (max !== null) {
          query = query.lte("base_price", max);
          countQuery = countQuery.lte("base_price", max);
        }
      }

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

      // Only run count on the first page; reuse it for subsequent pages.
      const [dataResult, countResult] = await Promise.all([
        query,
        pageParam === 0
          ? countQuery
          : Promise.resolve({ count: null as number | null }),
      ]);

      if (dataResult.error) throw dataResult.error;

      return {
        products: dataResult.data as Product[],
        totalCount: countResult.count ?? null,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const firstCount = allPages[0]?.totalCount ?? 0;
      const totalLoaded = allPages.reduce(
        (acc, page) => acc + page.products.length,
        0,
      );
      if (totalLoaded < firstCount) return lastPage.nextPage;
      return undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  const products = isEmpty ? [] : data?.pages.flatMap((p) => p.products) || [];
  const totalCount = isEmpty ? 0 : data?.pages[0]?.totalCount || 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const isLoading = isResolving || (!isEmpty && isLoadingPages);

  return {
    products,
    isLoading,
    isLoadingMore: isFetchingNextPage,
    error: error as Error | null,
    totalCount,
    hasMore: hasNextPage ?? false,
    loadMore,
    parentCategoryId: resolved?.parentCategoryId ?? null,
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
