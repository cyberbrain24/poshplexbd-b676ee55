import { useState } from "react";
import { useParams } from "react-router-dom";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar, { type SortOption, type ProductFilters } from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useOptimizedCategoryProducts } from "@/hooks/useOptimizedProducts";
import { CategorySEO } from "@/components/seo";

const DEFAULT_FILTERS: ProductFilters = {
  colorIds: [],
  sizeIds: [],
  subcategoryIds: [],
  priceRange: null,
};

const Category = () => {
  const { category } = useParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);

  const { totalCount, parentCategoryId } = useOptimizedCategoryProducts(category, sortBy, filters);

  const formatCategoryName = (cat: string | undefined) => {
    if (!cat || cat === 'all') return 'All Products';
    return cat.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const displayName = formatCategoryName(category);
  const slug = category || "all";

  return (
    <div className="min-h-screen bg-background">
      <CategorySEO 
        categoryName={displayName}
        categorySlug={slug}
        itemCount={totalCount}
      />
      <PoshplexHeader />
      
      <main className="pt-6">
        <CategoryHeader 
          category={formatCategoryName(category)}
          categorySlug={slug}
        />
        <div className="px-4 md:px-8 my-4"><PromotionSlot placement="category_top" categoryId={parentCategoryId} /></div>
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={totalCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filters={filters}
          onFiltersChange={setFilters}
          parentCategoryId={parentCategoryId}
        />
        
        <ProductGrid sortBy={sortBy} filters={filters} />
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default Category;
