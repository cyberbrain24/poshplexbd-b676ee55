import { Link } from "react-router-dom";
import { Star, BadgeCheck } from "lucide-react";
import { format } from "date-fns";

export interface ReviewLookData {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[] | null;
  created_at: string;
  customer_id: string | null;
  reviewer_name?: string | null;
  customer?: { name: string } | null;
  product?: {
    id: string;
    name: string;
    product_images?: { image_url: string; is_main: boolean }[];
  } | null;
}

const handleFromName = (name: string) =>
  "@" + name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 20);

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() ?? "").join("");

const getProductImage = (r: ReviewLookData) => {
  const main = r.product?.product_images?.find(i => i.is_main);
  return main?.image_url || r.product?.product_images?.[0]?.image_url;
};

const ReviewLookCard = ({ review }: { review: ReviewLookData }) => {
  const displayName = review.customer?.name || review.reviewer_name || "Anonymous";
  const handle = handleFromName(displayName);
  const heroImage = review.images?.[0] || getProductImage(review);
  const isVerified = !!review.customer_id;

  return (
    <Link
      to={`/product/${review.product_id}`}
      className="group block bg-card border border-border rounded-sm overflow-hidden hover:shadow-lg transition-shadow"
    >
      {heroImage && (
        <div className="aspect-[4/5] bg-muted overflow-hidden">
          <img
            src={heroImage}
            alt={review.product?.name || "Customer look"}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {initials(displayName) || "?"}
            </div>
            <span className="font-bold text-xs truncate">{handle}</span>
          </div>
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase bg-foreground text-background px-1.5 py-0.5 rounded">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${s <= review.rating ? "text-foreground fill-foreground" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>

        <p className="text-xs leading-snug line-clamp-3 text-foreground">
          {review.title ? <span className="font-semibold">{review.title}. </span> : null}
          {review.content}
        </p>

        <div className="text-[10px] text-muted-foreground">
          {format(new Date(review.created_at), "MMM d, yyyy")}
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground">#PoshplexFit</span>
          <span className="text-[9px] font-bold uppercase text-muted-foreground">#StreetwearDaily</span>
        </div>
      </div>
    </Link>
  );
};

export default ReviewLookCard;
