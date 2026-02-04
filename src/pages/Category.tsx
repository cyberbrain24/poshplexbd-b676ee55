import { useState } from "react";
import { useParams } from "react-router-dom";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useProducts } from "@/hooks/useProducts";

const Category = () => {
  const { category } = useParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { data: products } = useProducts();

  // Calculate filtered count
  const filteredCount = products?.filter(p => {
    if (!p.is_active) return false;
    if (!category || category === 'all') return true;
    return p.category?.name?.toLowerCase().replace(/\s+/g, '-') === category.toLowerCase();
  }).length || 0;

  // Format category name for display
  const formatCategoryName = (cat: string | undefined) => {
    if (!cat || cat === 'all') return 'All Products';
    return cat.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <main className="pt-6">
        <CategoryHeader 
          category={formatCategoryName(category)} 
        />
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={filteredCount}
        />
        
        <ProductGrid />
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default Category;
