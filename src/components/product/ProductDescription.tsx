import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewProduct from "./ReviewProduct";
import ReviewImages from "./ReviewImages";
import { Product } from "@/types/product";
import { useProductReviews } from "@/hooks/useReviews";

const CustomStar = ({ filled, className }: { filled: boolean; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={`w-3 h-3 ${filled ? 'text-foreground' : 'text-muted-foreground/30'} ${className}`}
  >
    <path 
      fillRule="evenodd" 
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" 
      clipRule="evenodd" 
    />
  </svg>
);

interface ProductDescriptionProps {
  product?: Product | null;
}

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  const { data: reviews = [] } = useProductReviews(product?.id || null);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  // Get dynamic content from product or use generic fallbacks
  const fullDescription = product?.full_description || `This product represents our commitment to quality streetwear. 
Designed with attention to detail and crafted from premium materials for lasting comfort and style.

Each piece is created with care, ensuring both durability and a perfect fit. 
The minimalist aesthetic makes it versatile for everyday wear or special occasions.`;

  const sizeGuideContent = product?.size_guide?.content || `S: Chest 36-38"
M: Chest 38-40"
L: Chest 40-42"
XL: Chest 42-44"`;

  const careContent = product?.care_instruction?.content || `• Machine wash cold with like colors
• Tumble dry low or hang to dry
• Do not bleach
• Iron on low heat if needed`;

  return (
    <div className="space-y-0 mt-4 border-t border-border">
      {/* Description */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className="w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Description</span>
          {isDescriptionOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isDescriptionOpen && (
          <div className="pb-6 space-y-4">
            {fullDescription.split('\n\n').map((paragraph, index) => (
              <p key={index} className="text-sm font-light text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Size Guide */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
          className="w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Size Guide</span>
          {isSizeGuideOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isSizeGuideOpen && (
          <div className="pb-6 space-y-4">
            <div className="space-y-3">
              {sizeGuideContent.split('\n').map((line, index) => {
                const parts = line.split(':');
                if (parts.length === 2) {
                  return (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm font-light text-muted-foreground">{parts[0].trim()}</span>
                      <span className="text-sm font-light text-foreground">{parts[1].trim()}</span>
                    </div>
                  );
                }
                return (
                  <p key={index} className="text-sm font-light text-muted-foreground">{line}</p>
                );
              })}
            </div>
            <p className="text-sm font-light text-muted-foreground">
              All measurements are approximate. For detailed sizing information, please visit our <a href="/about/size-guide" className="underline hover:opacity-70">Size Guide</a> page.
            </p>
          </div>
        )}
      </div>

      {/* Care Instructions */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => setIsCareOpen(!isCareOpen)}
          className="w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <span>Care & Cleaning</span>
          {isCareOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isCareOpen && (
          <div className="pb-6 space-y-4">
            <ul className="space-y-2">
              {careContent.split('\n').map((line, index) => (
                <li key={index} className="text-sm font-light text-muted-foreground">{line}</li>
              ))}
            </ul>
            <p className="text-sm font-light text-muted-foreground">
              For professional cleaning, visit your local jeweler or contact our customer service team.
            </p>
          </div>
        )}
      </div>

      {/* Customer Reviews */}
      <div className="border-b border-border lg:mb-16">
        <Button
          variant="ghost"
          onClick={() => setIsReviewsOpen(!isReviewsOpen)}
          className="w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent font-light rounded-none"
        >
          <div className="flex items-center gap-3">
            <span>Customer Reviews</span>
            {reviews.length > 0 && (
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <CustomStar
                    key={star}
                    filled={star <= Math.round(averageRating)}
                  />
                ))}
                <span className="text-sm font-light text-muted-foreground ml-1">
                  {averageRating.toFixed(1)} ({reviews.length})
                </span>
              </div>
            )}
          </div>
          {isReviewsOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isReviewsOpen && (
          <div className="pb-6 space-y-6">
            {/* Review Product Button */}
            <ReviewProduct productId={product?.id || ""} />

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p className="text-sm font-light text-muted-foreground text-center py-4">
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <CustomStar
                            key={star}
                            filled={star <= review.rating}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <span className="text-sm font-medium text-foreground">{review.title}</span>
                      )}
                    </div>
                    <p className="text-sm font-light text-muted-foreground leading-relaxed">
                      {review.content}
                    </p>
                    <ReviewImages images={review.images || []} size="sm" />
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;
