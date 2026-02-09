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

const ProductDetail = () => {
  const { productSlug } = useParams();
  const { data: product, isLoading } = useProduct(productSlug);

  // Fallback for product data
  const productName = product?.name || "Product";
  const categoryName = product?.category?.name || "Apparel";
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');

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
            <ProductImageGallery product={product} isLoading={isLoading} />
            
            <div className="lg:pl-12 mt-8 lg:mt-0 lg:sticky lg:top-6 lg:h-fit">
              <ProductInfo product={product} isLoading={isLoading} />
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
