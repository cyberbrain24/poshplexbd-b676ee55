import { Star } from "lucide-react";

interface ProductRatingBadgeProps {
  count: number;
  average: number;
  className?: string;
  size?: number;
}

const ProductRatingBadge = ({ count, average, className = "", size = 12 }: ProductRatingBadgeProps) => {
  if (!count) return null;
  const rounded = Math.round(average);
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-[1px]">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            width={size}
            height={size}
            className={s <= rounded ? "fill-foreground text-foreground" : "fill-muted text-muted-foreground/40"}
          />
        ))}
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">({count})</span>
    </div>
  );
};

export default ProductRatingBadge;
