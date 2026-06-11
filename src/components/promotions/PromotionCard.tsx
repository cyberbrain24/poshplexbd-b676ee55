import { X } from "lucide-react";
import type { Promotion } from "@/hooks/usePromotions";

interface Props {
  promo: Promotion;
  onClick: () => void;
  onDismiss?: () => void;
  variant?: "banner" | "card" | "inline-text";
}

const PromotionCard = ({ promo, onClick, onDismiss, variant = "banner" }: Props) => {
  const style: React.CSSProperties = {
    backgroundColor: promo.bg_color || undefined,
    color: promo.text_color || undefined,
  };

  if (variant === "inline-text") {
    return (
      <button
        onClick={onClick}
        style={style}
        className="w-full text-center py-2 px-4 text-xs font-semibold tracking-widest uppercase bg-foreground text-background hover:opacity-90"
      >
        {promo.title}
        {promo.subtitle && <span className="opacity-70 ml-2">— {promo.subtitle}</span>}
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-border bg-card cursor-pointer" onClick={onClick} style={style}>
        {promo.image_url && (
          <img src={promo.image_url} alt={promo.title} loading="lazy" className="w-full aspect-[16/9] object-cover" />
        )}
        <div className="p-4">
          <h3 className="font-bold uppercase tracking-tight text-sm">{promo.title}</h3>
          {promo.subtitle && <p className="text-xs opacity-70 mt-1">{promo.subtitle}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // banner
  return (
    <div
      className="relative group w-full cursor-pointer overflow-hidden rounded-lg bg-muted"
      onClick={onClick}
      style={style}
    >
      {promo.image_url ? (
        <img src={promo.image_url} alt={promo.title} loading="lazy" className="w-full max-h-72 object-cover" />
      ) : (
        <div className="px-6 py-8 text-center">
          <h3 className="font-bold uppercase tracking-tight text-lg">{promo.title}</h3>
          {promo.subtitle && <p className="text-sm opacity-80 mt-1">{promo.subtitle}</p>}
        </div>
      )}
      {onDismiss && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default PromotionCard;
