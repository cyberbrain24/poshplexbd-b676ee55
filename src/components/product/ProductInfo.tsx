import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, ProductVariant } from "@/types/product";
import VariantSelector from "./VariantSelector";
import ProductAttributesSelector from "./ProductAttributesSelector";
import ComboConfigurator, { ComboChildSelection } from "./ComboConfigurator";
import { useCart } from "@/contexts/CartContext";
import { generateProductSlug } from "@/lib/slug";
import { toast } from "sonner";
import { trackAddToCart } from "@/services/facebook-pixel.service";

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
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string>>({});
  const [comboSelections, setComboSelections] = useState<ComboChildSelection[]>([]);
  const [comboReady, setComboReady] = useState(false);
  const [comboItemsTotal, setComboItemsTotal] = useState(0);
  const { addToCart } = useCart();
  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
  
  const handleVariantChange = useCallback((variant: ProductVariant | null) => {
    setSelectedVariant(variant);
    if (variant?.color_id) {
      onColorChange?.(variant.color_id);
    } else if (!variant) {
      onColorChange?.(null);
    }
    onVariantImageChange?.(variant?.image_url || null);
    if (variant && window.innerWidth >= 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onColorChange, onVariantImageChange]);

  const handleComboChange = useCallback((selections: ComboChildSelection[], allReady: boolean, itemsTotal: number) => {
    setComboSelections(selections);
    setComboReady(allReady);
    setComboItemsTotal(itemsTotal);
  }, []);

  // Fallback data for static display
  const productName = product?.name || "Product";
  const categoryName = product?.category?.name || "Apparel";
  const categorySlug = categoryName.toLowerCase().replace(/\s+/g, '-');
  const basePrice = product?.base_price || 0;
  const displayPrice = selectedVariant?.selling_price || basePrice;
  const shortDescription = product?.short_description || "Quality streetwear designed for comfort and style.";
  const hasVariants = product?.variants && product.variants.length > 0;
  const isVariableProduct = product?.product_type === 'variable';
  const isComboProduct = product?.product_type === 'combo';
  const canAddToCart = isComboProduct ? comboReady : (!isVariableProduct || selectedVariant !== null);

  const getCartItem = () => {
    const mainImage = product?.images?.find(img => img.is_main)?.image_url 
      || product?.images?.[0]?.image_url 
      || '/placeholder.svg';

    if (isComboProduct) {
      const childSig = comboSelections
        .map(s => `${s.productId}:${s.variantId || 'base'}`)
        .join('|');
      return {
        id: `${product?.id || 'combo'}-combo-${childSig || 'na'}`,
        productId: product?.id,
        variantId: undefined,
        name: productName,
        price: basePrice,
        image: mainImage,
        category: categoryName,
        sku: product?.sku,
        comboChildren: comboSelections.map(s => ({
          productId: s.productId,
          variantId: s.variantId || null,
          name: s.name,
          image: s.image,
          sku: s.sku || null,
          color: s.color || null,
          size: s.size || null,
          quantity: s.quantity,
        })),
      };
    }

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

    const cartItem = getCartItem();
    addToCart(cartItem, quantity);

    // Fire FB Pixel AddToCart
    trackAddToCart({
      contentName: productName,
      contentIds: [product?.id || 'unknown'],
      value: displayPrice * quantity,
      quantity,
    });

    toast(`${productName} added to cart`, {
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
    <div className="space-y-2">
      {/* Product title and price */}
      <div className="space-y-1">
        <p className="text-sm font-light text-muted-foreground mb-1 hidden lg:block">{categoryName}</p>
        <div className="flex justify-between items-center">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">{productName}</h1>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xl font-light text-foreground">৳{displayPrice.toLocaleString()}</p>
              {selectedVariant && selectedVariant.selling_price !== basePrice && (
                <p className="text-sm font-light text-muted-foreground line-through">
                  ৳{basePrice.toLocaleString()}
                </p>
              )}
            </div>
            {product && (
              <FavoriteButton
                productId={product.id}
                name={productName}
                price={displayPrice}
                image={product.images?.find(img => img.is_main)?.image_url || product.images?.[0]?.image_url || '/placeholder.svg'}
                slug={generateProductSlug(product.name, product.id)}
                size={20}
              />
            )}
          </div>
        </div>
      </div>

      {/* Short description */}
      <div className="py-2 border-b border-border">
        <p className="text-sm font-light text-muted-foreground">{shortDescription}</p>
      </div>

      {/* Combo Configurator */}
      {isComboProduct && product?.id && (
        <div className="py-2 lg:py-4 lg:border-b lg:border-border">
          <ComboConfigurator comboProductId={product.id} onChange={handleComboChange} />
        </div>
      )}

      {/* Variant Selection */}
      {!isComboProduct && hasVariants && (
        <div className="py-2 lg:py-4 lg:border-b lg:border-border">
          <VariantSelector 
            variants={product!.variants!} 
            onVariantChange={handleVariantChange}
          />
        </div>
      )}

      {/* Product Attributes (Style, Edition, Pack, etc.) */}
      {product?.id && (
        <div className="py-2 lg:py-4 lg:border-b lg:border-border">
          <ProductAttributesSelector
            productId={product.id}
            selectedValueIds={selectedAttributeValues}
            onChange={(attributeId, valueId) =>
              setSelectedAttributeValues((prev) => {
                const next = { ...prev };
                if (valueId) next[attributeId] = valueId;
                else delete next[attributeId];
                return next;
              })
            }
          />
        </div>
      )}

      {/* Quantity - desktop only */}
      <div className="hidden lg:block space-y-4 pt-2">
        <div className="flex items-center gap-4 justify-start">
          <span className="text-sm font-light text-foreground">Quantity</span>
          <div className="flex items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={decrementQuantity}
              className="h-8 w-8 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="h-8 flex items-center px-3 text-sm font-light min-w-10 justify-center border-l border-r border-border">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={incrementQuantity}
              className="h-8 w-8 p-0 hover:bg-transparent hover:opacity-50 rounded-none border-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            className="flex-1 h-10 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
          >
            {((isVariableProduct && !selectedVariant) || (isComboProduct && !comboReady)) ? "Select Options" : "Add to Cart"}
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-10 border-foreground text-foreground hover:bg-foreground hover:text-background font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
        {isVariableProduct && !selectedVariant && (
          <p className="text-xs text-muted-foreground text-center">
            Please select color and size to add to cart
          </p>
        )}
        {isComboProduct && !comboReady && (
          <p className="text-xs text-muted-foreground text-center">
            Configure each bundle item to continue
          </p>
        )}
      </div>

      {/* Mobile sticky bottom bar - above footer nav */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-background border-t border-border p-3 lg:hidden">
        <div className="flex gap-3">
          <Button 
            className="flex-1 h-10 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
          >
            {((isVariableProduct && !selectedVariant) || (isComboProduct && !comboReady)) ? "Select Options" : "Add to Cart"}
          </Button>
          <Button 
            variant="outline"
            className="flex-1 h-10 border-foreground text-foreground hover:bg-foreground hover:text-background font-light rounded-none disabled:opacity-50"
            disabled={!canAddToCart}
            onClick={handleBuyNow}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
