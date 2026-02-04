import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import productHoodie from "@/assets/product-hoodie.jpg";
import productCargo from "@/assets/product-cargo.jpg";
import productTee from "@/assets/product-tee.jpg";
import productBomber from "@/assets/product-bomber.jpg";

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
}

const products: Product[] = [
  {
    id: "1",
    name: "ESSENTIAL OVERSIZED HOODIE",
    price: "৳2,450",
    image: productHoodie,
    category: "Hoodies",
    isNew: true
  },
  {
    id: "2",
    name: "UTILITY CARGO PANTS",
    price: "৳2,850",
    image: productCargo,
    category: "Pants",
    isNew: true
  },
  {
    id: "3",
    name: "CLASSIC SLATE TEE",
    price: "৳1,250",
    image: productTee,
    category: "T-Shirts"
  },
  {
    id: "4",
    name: "MA-1 BOMBER JACKET",
    price: "৳4,500",
    originalPrice: "৳5,500",
    image: productBomber,
    category: "Jackets",
    isSale: true
  }
];

const ProductGrid = () => {
  return (
    <section className="w-full px-6 py-20">
      {/* Section Header */}
      <div className="flex items-baseline gap-4 mb-10">
        <span className="text-6xl md:text-8xl font-black text-muted-foreground/30">
          02
        </span>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
          NEW ARRIVALS
        </h2>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {products.map((product) => (
          <div key={product.id} className="group">
            {/* Product Image */}
            <Link 
              to={`/product/${product.id}`}
              className="block relative bg-slate-muted aspect-[3/4] overflow-hidden mb-4"
            >
              <img 
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-foreground text-background px-2 py-1 text-[10px] font-medium tracking-wider">
                    NEW
                  </span>
                )}
                {product.isSale && (
                  <span className="bg-foreground text-background px-2 py-1 text-[10px] font-medium tracking-wider">
                    SALE
                  </span>
                )}
              </div>
            </Link>

            {/* Product Info */}
            <div>
              <p className="text-xs text-muted-foreground mb-1 tracking-wide">
                {product.category}
              </p>
              <Link 
                to={`/product/${product.id}`}
                className="block text-sm font-medium text-foreground tracking-wide mb-2 hover:text-nav-hover transition-colors"
              >
                {product.name}
              </Link>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                
                <button 
                  className="p-2 border border-border hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <div className="flex justify-center mt-12">
        <Link 
          to="/category/new-drops"
          className="inline-flex items-center gap-2 border border-foreground px-8 py-4 text-sm font-medium tracking-wider hover:bg-foreground hover:text-background transition-colors"
        >
          VIEW ALL PRODUCTS
        </Link>
      </div>
    </section>
  );
};

export default ProductGrid;