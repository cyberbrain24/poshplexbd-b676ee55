import { useState } from "react";
import { useParams } from "react-router-dom";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useOptimizedCategoryProducts } from "@/hooks/useOptimizedProducts";
import { CategorySEO } from "@/components/seo";

const Category = () => {
  const { category } = useParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { totalCount } = useOptimizedCategoryProducts(category);

  // Format category name for display
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
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={totalCount}
        />
        
        <ProductGrid />
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default Category;
