import { Link } from "react-router-dom";
import { Star, Pencil, Trash2 } from "lucide-react";
import { useCustomerReviews, useDeleteReview, Review } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { generateProductSlug } from "@/lib/slug";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MyReviewsProps {
  customerId: string | null;
}

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => {
  const deleteMutation = useDeleteReview();
  
  const productImage = review.product?.product_images?.find(img => img.is_main)?.image_url 
    || review.product?.product_images?.[0]?.image_url
    || "/placeholder.svg";
  
  const productSlug = review.product 
    ? generateProductSlug(review.product.name, review.product.id)
    : "";

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(review.id);
      toast.success("Review deleted successfully");
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <Link 
            to={`/product/${productSlug}`}
            className="shrink-0"
          >
            <div className="w-20 h-20 bg-muted overflow-hidden">
              <img
                src={productImage}
                alt={review.product?.name || "Product"}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* Review Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link 
                  to={`/product/${productSlug}`}
                  className="font-medium text-foreground hover:underline line-clamp-1"
                >
                  {review.product?.name || "Unknown Product"}
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={review.rating} />
                  {!review.is_approved && (
                    <Badge variant="secondary" className="text-xs">
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <Link to={`/product/${productSlug}?edit_review=true`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Review</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this review? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {review.title && (
              <p className="font-medium text-sm mt-2">{review.title}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {review.content}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MyReviews = ({ customerId }: MyReviewsProps) => {
  const { data: reviews = [], isLoading } = useCustomerReviews(customerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium">My Reviews</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-20 h-20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">My Reviews</h2>
      
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              You haven't written any reviews yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Share your thoughts on products you've purchased!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReviews;
