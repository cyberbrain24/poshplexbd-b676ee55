import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { toast } from "sonner";
import ReviewImageUpload from "./ReviewImageUpload";

const CustomStar = ({ filled, onClick, className }: { filled: boolean; onClick: () => void; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    className={`w-5 h-5 cursor-pointer ${filled ? 'text-foreground' : 'text-muted-foreground/30'} ${className}`}
    onClick={onClick}
  >
    <path 
      fillRule="evenodd" 
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" 
      clipRule="evenodd" 
    />
  </svg>
);

interface ReviewProductProps {
  productId: string;
}

const ReviewProduct = ({ productId }: ReviewProductProps) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  // Check for edit_review query param
  useEffect(() => {
    if (searchParams.get("edit_review") === "true") {
      setIsOpen(true);
      // Remove the query param
      searchParams.delete("edit_review");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check authentication and get customer_id
  const loadExistingReview = async (cid: string) => {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("customer_id", cid)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReview) {
      setExistingReviewId(existingReview.id);
      setRating(existingReview.rating);
      setTitle(existingReview.title || "");
      setReview(existingReview.content);
      setImages(existingReview.images || []);
    }
  };

  // Resolves (and if needed creates) the customer record linked to the signed-in user
  const resolveCustomerId = async (): Promise<string | null> => {
    if (customerId) return customerId;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: accountData } = await supabase
      .from("customer_accounts")
      .select("customer_id")
      .eq("auth_user_id", session.user.id)
      .maybeSingle();

    let cid = accountData?.customer_id ?? null;

    if (!cid) {
      const { data: ensured, error } = await supabase.rpc("ensure_my_customer_id");
      if (error) {
        console.error("ensure_my_customer_id failed:", error);
        return null;
      }
      cid = (ensured as string | null) ?? null;
    }

    if (cid) {
      setCustomerId(cid);
      await loadExistingReview(cid);
    }
    return cid;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);

        const { data: accountData } = await supabase
          .from("customer_accounts")
          .select("customer_id")
          .eq("auth_user_id", session.user.id)
          .maybeSingle();

        if (accountData?.customer_id) {
          setCustomerId(accountData.customer_id);
          await loadExistingReview(accountData.customer_id);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      setIsOpen(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setIsAuthenticated(false);
      toast.error("Please login to write a review");
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setIsAuthenticated(true);

    const cid = await resolveCustomerId();
    if (!cid) {
      toast.error("Could not set up your profile for reviews. Please try again.");
      return;
    }

    setIsOpen(true);
  };


  const submitReview = async () => {
    const cid = await resolveCustomerId();
    if (!cid) {
      toast.error("Please login to submit a review");
      return;
    }

    setIsSubmitting(true);

    
    try {
      if (existingReviewId) {
        // Update existing review
        await updateReview.mutateAsync({
          id: existingReviewId,
          data: {
            rating,
            title: title.trim() || undefined,
            content: review.trim(),
            images,
          },
        });
        toast.success("Review updated successfully!");
      } else {
        // Create new review
        await createReview.mutateAsync({
          customer_id: cid,
          product_id: productId,
          rating,
          title: title.trim() || undefined,
          content: review.trim(),
          images,
        });
        toast.success("Review submitted! It will appear after approval.");
      }
      
      setIsOpen(false);
    } catch (error: any) {
      console.error("Review submission error:", error);
      if (error.code === "23505") {
        toast.error("You have already reviewed this product");
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-12 font-light rounded-none bg-muted text-foreground border-border hover:bg-muted/80 hover:text-foreground"
        >
          {existingReviewId ? "Edit your review" : "Review product"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md !rounded-none">
        <DialogHeader>
          <DialogTitle className="font-light text-xl">
            {existingReviewId ? "Edit your review" : "Review product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-light text-foreground">Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <CustomStar
                  key={star}
                  filled={star <= rating}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-light text-foreground">Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review"
              className="rounded-none font-light"
            />
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-light text-foreground">Your review</Label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="min-h-24 resize-none rounded-none font-light"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-light text-foreground">Photos (optional)</Label>
            <ReviewImageUpload images={images} onChange={setImages} maxImages={3} />
          </div>
          
          <Button 
            onClick={submitReview}
            disabled={rating === 0 || review.trim() === "" || isSubmitting}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-light rounded-none"
          >
            {isSubmitting ? "Submitting..." : existingReviewId ? "Update review" : "Submit review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewProduct;
