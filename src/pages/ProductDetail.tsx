import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import RelatedProducts from "../components/product/RelatedProducts";
import { useProduct } from "@/hooks/useProducts";
import { ProductSEO } from "@/components/seo";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { trackViewContent } from "@/services/facebook-pixel.service";

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { data: product, isLoading } = useProduct(productSlug);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedVariantImageUrl, setSelectedVariantImageUrl] = useState<string | null>(null);

  const handleColorChange = useCallback((colorId: string | null) => {
    setSelectedColorId(colorId);
  }, []);

  const handleVariantImageChange = useCallback((imageUrl: string | null) => {
    setSelectedVariantImageUrl(imageUrl);
  }, []);

  const productName = product?.name || "Product";
  const categoryName = product?.category?.name || "Apparel";
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');

  // Track ViewContent when product loads
  useEffect(() => {
    if (product?.id) {
      trackViewContent({
        contentName: product.name,
        contentIds: [product.id],
        value: product.base_price || 0,
      });
    }
  }, [product?.id]);

  return (
    <div className="min-h-screen bg-background">
      <ProductSEO product={product} />
      <PoshplexHeader />
      
      <main className="pt-6">
        <section className="w-full px-6">
          {/* Breadcrumb - Show above image on smaller screens */}
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/category/${categorySlug}`}>{categoryName}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{productName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <ProductImageGallery 
              product={product} 
              isLoading={isLoading} 
              selectedColorId={selectedColorId}
              selectedVariantImageUrl={selectedVariantImageUrl}
            />
            
            <div className="lg:pl-12 mt-8 lg:mt-0 lg:sticky lg:top-6 lg:h-fit">
              <ProductInfo 
                product={product} 
                isLoading={isLoading} 
                onColorChange={handleColorChange}
                onVariantImageChange={handleVariantImageChange}
              />
              <ProductDescription product={product} />
            </div>
          </div>
        </section>
        
        {/* You Might Also Like - Dynamic products */}
        <section className="w-full mt-16 lg:mt-24">
          <RelatedProducts 
            productId={product?.id}
            categoryId={product?.category_id}
            categoryName={categoryName}
            title="You might also like"
          />
        </section>
      </main>
      
      <PoshplexFooter />
    </div>
  );
};

export default ProductDetail;