import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import PoshplexHeader from "../components/header/PoshplexHeader";
import PoshplexFooter from "../components/footer/PoshplexFooter";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import RelatedProducts from "../components/product/RelatedProducts";
import { useProduct } from "@/hooks/useProducts";
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

  // Track ViewContent when product loads — deferred to idle so it does not
  // compete with the LCP image fetch on mobile cold loads. Latched per
  // product.id so StrictMode (dev) and re-renders never double-fire.
  const firedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!product?.id || firedFor.current === product.id) return;
    firedFor.current = product.id;
    const fire = () => trackViewContent({
      contentName: product.name,
      contentIds: [product.id],
      value: product.base_price || 0,
    });
    const ric = (window as any).requestIdleCallback;
    const handle = ric ? ric(fire, { timeout: 2000 }) : window.setTimeout(fire, 1200);
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (ric && cic) cic(handle);
      else window.clearTimeout(handle as number);
    };
  }, [product?.id, product?.name, product?.base_price]);

  return (
    <div className="min-h-screen bg-background">
      <PoshplexHeader />
      
      <main className="pt-1">
        
        <section className="w-full px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <ProductImageGallery 
              product={product} 
              isLoading={isLoading} 
              selectedColorId={selectedColorId}
              selectedVariantImageUrl={selectedVariantImageUrl}
            />
            
            <div className="lg:pl-12 mt-1.5 lg:mt-8 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:scrollbar-hide">
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
        <section className="w-full mt-8 lg:mt-14">
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