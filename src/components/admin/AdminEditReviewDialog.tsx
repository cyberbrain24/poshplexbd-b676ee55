import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReviewImageUpload from "@/components/product/ReviewImageUpload";

interface EditReviewData {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[] | null;
  is_approved: boolean;
  reviewer_name?: string | null;
  created_at: string;
  customer?: { name: string; phone: string } | null;
  product?: { name: string; sku: string } | null;
}

interface Props {
  review: EditReviewData | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const AdminEditReviewDialog = ({ review, open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [approved, setApproved] = useState(true);
  const [reviewerName, setReviewerName] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (review && open) {
      setRating(review.rating);
      setTitle(review.title || "");
      setContent(review.content);
      setImages(review.images || []);
      setApproved(review.is_approved);
      setReviewerName(review.reviewer_name || "");
      setCreatedAt(
        review.created_at ? new Date(review.created_at).toISOString().slice(0, 10) : ""
      );
    }
  }, [review, open]);

  const canSubmit = useMemo(
    () => !!content.trim() && rating >= 1 && rating <= 5,
    [content, rating]
  );

  const submit = async () => {
    if (!review) return;
    setSubmitting(true);
    try {
      const payload: any = {
        rating,
        title: title.trim() || null,
        content: content.trim(),
        images,
        is_approved: approved,
      };
      if (!review.customer) {
        payload.reviewer_name = reviewerName.trim() || null;
      }
      if (createdAt) {
        payload.created_at = new Date(createdAt).toISOString();
      }
      const { error } = await supabase
        .from("reviews")
        .update(payload)
        .eq("id", review.id);
      if (error) throw error;
      toast.success("Review updated");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["featured-reviews"] });
      qc.invalidateQueries({ queryKey: ["all-public-reviews"] });
      qc.invalidateQueries({ queryKey: ["product-reviews"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>

        {review && (
          <div className="space-y-5 pt-2">
            <div className="p-2 border rounded bg-muted/40 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Product:</span>{" "}
                <span className="font-medium">{review.product?.name}</span>{" "}
                <span className="text-muted-foreground">({review.product?.sku})</span>
              </div>
              {review.customer && (
                <div>
                  <span className="text-muted-foreground">Customer:</span>{" "}
                  <span className="font-medium">{review.customer.name}</span>{" "}
                  <span className="text-muted-foreground">{review.customer.phone}</span>
                </div>
              )}
            </div>

            {!review.customer && (
              <div className="space-y-2">
                <Label>Reviewer name</Label>
                <Input
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} className="p-1">
                    <Star
                      className={`h-6 w-6 ${
                        s <= rating ? "text-foreground fill-foreground" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Review *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <ReviewImageUpload images={images} onChange={setImages} maxImages={5} />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={approved} onCheckedChange={(v) => setApproved(!!v)} />
                Approved
              </label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={createdAt}
                  onChange={(e) => setCreatedAt(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSubmit || submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminEditReviewDialog;
