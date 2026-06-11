import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Tag } from "lucide-react";
import { usePromotions, incrementPromotionClick, incrementPromotionView, type Promotion } from "@/hooks/usePromotions";
import PromotionPopup from "./PromotionPopup";
import { isDismissed, dismiss } from "./dismiss";

const FloatingPromotion = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: promos = [] } = usePromotions("floating");
  const [activePopup, setActivePopup] = useState<Promotion | null>(null);
  const [, force] = useState(0);

  const isAdmin = location.pathname.startsWith("/admin");

  const promo = useMemo(
    () => promos.find((p) => !p.dismissible || !isDismissed(p.id)) || null,
    [promos]
  );

  useEffect(() => {
    if (promo) incrementPromotionView(promo.id);
  }, [promo?.id]);

  if (isAdmin || !promo) return null;

  const handleClick = () => {
    incrementPromotionClick(promo.id);
    if (promo.action_type === "popup") setActivePopup(promo);
    else if (promo.action_type === "url" && promo.action_value) window.open(promo.action_value, "_blank", "noopener,noreferrer");
    else if (promo.action_type === "product" && promo.action_value) navigate(`/product/${promo.action_value}`);
    else if (promo.action_type === "category" && promo.action_value) navigate(`/category/${promo.action_value}`);
    else setActivePopup(promo);
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-2">
        <button
          onClick={handleClick}
          className="group flex items-center gap-2 bg-foreground text-background rounded-full pl-3 pr-4 py-2.5 shadow-lg hover:scale-105 transition-transform"
          style={{
            backgroundColor: promo.bg_color || undefined,
            color: promo.text_color || undefined,
          }}
        >
          <Tag className="w-4 h-4" />
          <span className="text-xs font-semibold tracking-wider uppercase">
            {promo.title}
          </span>
        </button>
        {promo.dismissible && (
          <button
            onClick={() => { dismiss(promo.id); force((n) => n + 1); }}
            className="bg-foreground/80 text-background rounded-full p-1.5 shadow-lg"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <PromotionPopup promo={activePopup} open={!!activePopup} onOpenChange={(o) => !o && setActivePopup(null)} />
    </>
  );
};

export default FloatingPromotion;
