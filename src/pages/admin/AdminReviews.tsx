import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, X, Star, Trash2, Eye, Sparkles, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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
import AdminEditReviewDialog from "@/components/admin/AdminEditReviewDialog";

interface Review {
  id: string;
  customer_id: string | null;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[] | null;
  is_approved: boolean;
  is_featured?: boolean;
  created_at: string;
  reviewer_name?: string | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    product_images?: { image_url: string; is_main: boolean }[];
  } | null;
}

const AdminReviews = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "featured">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Review | null>(null);
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          customer:customers(id, name, phone),
          product:products(id, name, sku, product_images(image_url, is_main))
        `)
        .order("created_at", { ascending: false });

      if (filter === "pending") query = query.eq("is_approved", false);
      else if (filter === "approved") query = query.eq("is_approved", true);
      else if (filter === "featured") query = query.eq("is_featured", true);

      const { data, error } = await query;
      if (error) throw error;
      return data as Review[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => {
      const hay = [
        r.customer?.name,
        r.customer?.phone,
        r.reviewer_name,
        r.product?.name,
        r.product?.sku,
        r.title,
        r.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [reviews, search]);

  const approveReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review approved");
    },
    onError: () => toast.error("Failed to approve review"),
  });

  const rejectReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ is_approved: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review unapproved");
    },
    onError: () => toast.error("Failed to update review"),
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
    onError: () => toast.error("Failed to delete review"),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_featured: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["featured-reviews"] });
      toast.success(vars.value ? "Marked as featured" : "Removed from featured");
    },
    onError: () => toast.error("Failed to update featured status"),
  });

  const getProductImage = (review: Review) => {
    const main = review.product?.product_images?.find((img) => img.is_main);
    return main?.image_url || review.product?.product_images?.[0]?.image_url;
  };

  const getReviewImage = (review: Review) => review.images?.[0] || getProductImage(review);

  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const approvedCount = reviews.filter((r) => r.is_approved).length;

  if (isLoading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage customer reviews and approvals
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {pendingCount} Pending
          </Badge>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {approvedCount} Approved
          </Badge>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reviews</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="featured">Featured</SelectItem>
            </SelectContent>
          </Select>
          <AdminCreateReviewDialog />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, product, SKU, or review text..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filtered.length} of {reviews.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No reviews found
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((review) => {
            const img = getReviewImage(review);
            return (
              <Card key={review.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-muted relative">
                  {img ? (
                    <img
                      src={img}
                      alt={review.product?.name || ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
                    <Badge
                      className={`text-[9px] px-1.5 py-0 h-4 ${
                        review.is_approved
                          ? "bg-emerald-600 hover:bg-emerald-600"
                          : "bg-amber-500 hover:bg-amber-500"
                      } text-white`}
                    >
                      {review.is_approved ? "Approved" : "Pending"}
                    </Badge>
                    {review.is_featured && (
                      <Badge className="bg-foreground text-background hover:bg-foreground text-[9px] px-1.5 py-0 h-4 gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" /> Featured
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-2.5 space-y-1.5 flex-1 flex flex-col">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= review.rating
                            ? "text-foreground fill-foreground"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium truncate" title={review.product?.name}>
                    {review.product?.name || "Unknown product"}
                  </p>
                  {review.title && (
                    <p className="text-xs font-semibold line-clamp-1">{review.title}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground line-clamp-2 flex-1">
                    {review.content}
                  </p>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {review.customer?.name || review.reviewer_name || "Anonymous"}
                    {review.customer?.phone ? ` · ${review.customer.phone}` : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t">
                    {review.is_approved ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        title={review.is_featured ? "Unfeature" : "Feature on homepage"}
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          toggleFeatured.mutate({ id: review.id, value: !review.is_featured })
                        }
                      >
                        <Sparkles
                          className={`h-3.5 w-3.5 ${
                            review.is_featured ? "fill-foreground" : ""
                          }`}
                        />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Approve"
                        className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => approveReview.mutate(review.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {review.is_approved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Unapprove"
                        className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50"
                        onClick={() => rejectReview.mutate(review.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit"
                      className="h-7 w-7 p-0"
                      onClick={() => setEditing(review)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <a
                      href={`/product/${review.product_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost" title="View product" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Delete"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AdminEditReviewDialog
        review={editing as any}
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
};

export default AdminReviews;
