import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReviewProduct from "./ReviewProduct";
import ReviewImages from "./ReviewImages";
import EditMyReviewDialog from "./EditMyReviewDialog";
import { Product } from "@/types/product";
import { useProductReviews } from "@/hooks/useReviews";
import { parseSizeGuideContent } from "@/components/admin/SizeGuideTableEditor";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const isMobile = window.innerWidth < 1024;
  const [openSection, setOpenSection] = useState<string | null>(isMobile ? null : 'sizeGuide');

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const isDescriptionOpen = openSection === 'description';
  const isSizeGuideOpen = openSection === 'sizeGuide';
  const isCareOpen = openSection === 'care';
  const isReviewsOpen = openSection === 'reviews';

  const { data: reviews = [] } = useProductReviews(product?.id || null);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [viewingReview, setViewingReview] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("customer_accounts")
        .select("customer_id")
        .eq("auth_user_id", session.user.id)
        .maybeSingle();
      if (active && data?.customer_id) setCurrentCustomerId(data.customer_id);
    })();
    return () => { active = false; };
  }, []);

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
          onClick={() => toggleSection('description')}
          className={`w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent rounded-none ${isDescriptionOpen ? 'font-semibold' : 'font-light'}`}
        >
          <span className={isDescriptionOpen ? 'text-foreground' : ''}>Description</span>
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
          onClick={() => toggleSection('sizeGuide')}
          className={`w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent rounded-none ${isSizeGuideOpen ? 'font-semibold' : 'font-light'}`}
        >
          <span className={isSizeGuideOpen ? 'text-foreground' : ''}>Size Guide</span>
          {isSizeGuideOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {isSizeGuideOpen && (
          <div className="pb-6 space-y-4">
            {(() => {
              const tableData = parseSizeGuideContent(sizeGuideContent);
              if (tableData) {
                // Render as structured table
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          {tableData.columns.map((col, i) => (
                            <th
                              key={i}
                              className="text-left font-medium text-foreground py-2 px-3 border-b border-border"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.rows.map((row, ri) => (
                          <tr key={ri} className="border-b border-border last:border-b-0">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className={`py-2 px-3 text-sm font-light ${ci === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                              >
                                {cell || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              // Fallback: legacy text format
              return (
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
              );
            })()}
          </div>
        )}
      </div>

      {/* Care Instructions */}
      <div className="border-b border-border">
        <Button
          variant="ghost"
          onClick={() => toggleSection('care')}
          className={`w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent rounded-none ${isCareOpen ? 'font-semibold' : 'font-light'}`}
        >
          <span className={isCareOpen ? 'text-foreground' : ''}>Care & Cleaning</span>
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
          onClick={() => toggleSection('reviews')}
          className={`w-full h-10 lg:h-14 px-0 justify-between hover:bg-transparent rounded-none ${isReviewsOpen ? 'font-semibold' : 'font-light'}`}
        >
          <div className="flex items-center gap-2">
            <span className={isReviewsOpen ? 'text-foreground' : ''}>Customer Reviews</span>
            {reviews.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-foreground text-background text-xs font-medium">
                {reviews.length}
              </span>
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
                      {review.reviewer_name ? `${review.reviewer_name} · ` : ""}{new Date(review.created_at).toLocaleDateString()}
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
