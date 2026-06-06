import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Star, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import ReviewImages from "@/components/product/ReviewImages";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminCreateReviewDialog from "@/components/admin/AdminCreateReviewDialog";

interface Review {
  id: string;
  customer_id: string | null;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[] | null;
  is_approved: boolean;
  created_at: string;
  reviewer_name?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    product_images?: { image_url: string; is_main: boolean }[];
  };
}

const AdminReviews = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          customer:customers(id, name, phone),
          product:products(
            id, 
            name, 
            sku,
            product_images(image_url, is_main)
          )
        `)
        .order("created_at", { ascending: false });

      if (filter === "pending") {
        query = query.eq("is_approved", false);
      } else if (filter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
  });

  const approveReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review approved");
    },
    onError: () => {
      toast.error("Failed to approve review");
    },
  });

  const rejectReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review rejected");
    },
    onError: () => {
      toast.error("Failed to reject review");
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review deleted");
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });

  const getProductImage = (review: Review) => {
    const mainImage = review.product?.product_images?.find((img) => img.is_main);
    return mainImage?.image_url || review.product?.product_images?.[0]?.image_url;
  };

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer reviews and approvals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {pendingCount} Pending
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {approvedCount} Approved
            </Badge>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
          <AdminCreateReviewDialog />
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    {getProductImage(review) ? (
                      <img
                        src={getProductImage(review)}
                        alt={review.product?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {review.product?.name || "Unknown Product"}
                          </span>
                          <Badge
                            variant={review.is_approved ? "default" : "secondary"}
                            className={
                              review.is_approved
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {review.is_approved ? "Approved" : "Pending"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating
                                  ? "text-foreground fill-foreground"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!review.is_approved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => approveReview.mutate(review.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {review.is_approved && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => rejectReview.mutate(review.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <a
                          href={`/product/${review.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </a>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                              <AlertDialogAction
                                onClick={() => deleteReview.mutate(review.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {review.title && (
                      <p className="font-medium text-sm mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.content}
                    </p>

                    {/* Review Images */}
                    <ReviewImages images={review.images || []} size="sm" />

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>By: {review.customer?.name || review.reviewer_name || "Anonymous"}</span>
                      <span>•</span>
                      <span>{format(new Date(review.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
