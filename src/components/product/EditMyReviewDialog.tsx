import { useEffect, useState } from "react";
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
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReviewImageUpload from "@/components/product/ReviewImageUpload";

interface MyReview {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[] | null;
}

interface Props {
  review: MyReview | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const EditMyReviewDialog = ({ review, open, onOpenChange }: Props) => {
  const qc = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (review && open) {
      setRating(review.rating);
      setTitle(review.title || "");
      setContent(review.content);
      setImages(review.images || []);
    }
  }, [review, open]);

  const submit = async () => {
    if (!review) return;
    if (!content.trim()) {
      toast.error("Please write your review");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          rating,
          title: title.trim() || null,
          content: content.trim(),
          images,
          is_approved: false,
        })
        .eq("id", review.id);
      if (error) throw error;
      toast.success("Review updated. It will reappear after moderation.");
      qc.invalidateQueries({ queryKey: ["product-reviews", review.product_id] });
      qc.invalidateQueries({ queryKey: ["customer-reviews"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to update review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !rounded-none">
        <DialogHeader>
          <DialogTitle className="font-light text-xl">Edit your review</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-light">Rating</Label>
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

          <div className="space-y-3">
            <Label className="text-sm font-light">Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-none font-light"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-light">Your review</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-24 resize-none rounded-none font-light"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-light">Photos (optional)</Label>
            <ReviewImageUpload images={images} onChange={setImages} maxImages={3} />
          </div>

          <Button
            onClick={submit}
            disabled={submitting}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Update review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMyReviewDialog;
