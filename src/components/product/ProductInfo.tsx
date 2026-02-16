import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { Minus, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, ProductVariant } from "@/types/product";
import VariantSelector from "./VariantSelector";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface ProductInfoProps {
  product?: Product | null;
  isLoading?: boolean;
  onColorChange?: (colorId: string | null) => void;
  onVariantImageChange?: (imageUrl: string | null) => void;
}

const ProductInfo = ({ product, isLoading, onColorChange, onVariantImageChange }: ProductInfoProps) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { addToCart } = useCart();
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  
  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
    // Notify parent of color change for image filtering
    if (variant?.color_id) {
      onColorChange?.(variant.color_id);
    } else if (!variant) {
      onColorChange?.(null);
    }
    // Notify parent of variant-specific image
    onVariantImageChange?.(variant?.image_url || null);
  }, [onColorChange, onVariantImageChange]);

  // Fallback data for static display
  const productName = product?.name || "Product";
  const categoryName = product?.category?.name || "Apparel";
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
  const basePrice = product?.base_price || 0;
  const displayPrice = selectedVariant?.selling_price || basePrice;
  const shortDescription = product?.short_description || "Quality streetwear designed for comfort and style.";
  const hasVariants = product?.variants && product.variants.length > 0;
  const isVariableProduct = product?.product_type === 'variable';
  const canAddToCart = !isVariableProduct || selectedVariant !== null;

  const getCartItem = () => {
    const mainImage = product?.images?.find(img => img.is_main)?.image_url 
      || product?.images?.[0]?.image_url 
      || '/placeholder.svg';

    return {
      id: `${product?.id || 'fallback'}-${selectedVariant?.id || 'base'}`,
      productId: product?.id,
      variantId: selectedVariant?.id,
      name: productName,
      price: displayPrice,
      image: mainImage,
      category: categoryName,
      color: selectedVariant?.color?.name,
      size: selectedVariant?.size?.label,
      sku: selectedVariant?.sku,
    };
  };

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    addToCart(getCartItem(), quantity);

    toast(`${productName} added to bag`, {
      description: selectedVariant 
        ? `${selectedVariant.color?.name || ''} ${selectedVariant.size?.label || ''} × ${quantity}`
        : `× ${quantity}`,
      position: "bottom-center",
      className: "mb-20",
    });

    setQuantity(1);
    window.dispatchEvent(new CustomEvent('open-shopping-bag'));
  };

  const handleBuyNow = () => {
    if (!canAddToCart) return;
    addToCart(getCartItem(), quantity);
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb - Show only on desktop */}
      <div className="hidden lg:block">
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

      {/* Product title and price */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-light text-muted-foreground mb-1">{categoryName}</p>
            <h1 className="text-2xl md:text-3xl font-light text-foreground">{productName}</h1>
          </div>
          <div className="text-right">
            <p className="text-xl font-light text-foreground">৳{displayPrice.toLocaleString()}</p>
            {selectedVariant && selectedVariant.selling_price !== basePrice && (
              <p className="text-sm font-light text-muted-foreground line-through">
                ৳{basePrice.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Short description */}
      <div className="py-4 border-b border-border">
        <p className="text-sm font-light text-muted-foreground">{shortDescription}</p>
      </div>

      {/* Variant Selection */}
      {hasVariants && (
        <div className="py-4 border-b border-border">
          <VariantSelector 
            variants={product!.variants!} 
            onVariantChange={handleVariantChange}
          />
        </div>
      )}

      {/* Quantity and Add to Cart */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-light text-foreground">Quantity</span>
          <div className="flex items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementQuantity}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="h-10 flex items-center px-4 text-sm font-light min-w-12 justify-center border-l border-r border-border">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementQuantity}
              className="h-10 w-10 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
          >
            {isVariableProduct && !selectedVariant ? "Select Options" : "Add to Bag"}
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-12 border-foreground text-foreground hover:bg-foreground hover:text-background font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
        {isVariableProduct && !selectedVariant && (
          <p className="text-xs text-muted-foreground text-center">
            Please select color and size to add to bag
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
