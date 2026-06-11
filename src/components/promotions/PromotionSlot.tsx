import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePromotions, incrementPromotionClick, incrementPromotionView, type Promotion } from "@/hooks/usePromotions";
import PromotionCard from "./PromotionCard";
import PromotionPopup from "./PromotionPopup";
import { isDismissed, dismiss } from "./dismiss";

interface Props {
  placement: string;
  categoryId?: string | null;
  productId?: string | null;
  className?: string;
  max?: number;
}

const PromotionSlot = ({ placement, categoryId, productId, className = "", max = 3 }: Props) => {
  const { data: promos = [] } = usePromotions(placement, { categoryId, productId });
  const [activePopup, setActivePopup] = useState<Promotion | null>(null);
  const navigate = useNavigate();

  const visible = useMemo(() => promos.filter((p) => !p.dismissible || !isDismissed(p.id)).slice(0, max), [promos, max]);

  useEffect(() => {
    visible.forEach((p) => incrementPromotionView(p.id));
  }, [visible]);

  if (visible.length === 0) return null;

  const handleClick = (p: Promotion) => {
    incrementPromotionClick(p.id);
    switch (p.action_type) {
      case "popup":
        setActivePopup(p);
        return;
      case "product":
        if (p.action_value) navigate(`/product/${p.action_value}`);
        return;
      case "category":
        if (p.action_value) navigate(`/category/${p.action_value}`);
        return;
      case "url":
        if (p.action_value) window.open(p.action_value, "_blank", "noopener,noreferrer");
        return;
      default:
        return;
    }
  };

  return (
    <div className={`promotion-slot space-y-4 ${className}`}>
      {visible.map((p) => (
        <PromotionCard
          key={p.id}
          promo={p}
          onClick={() => handleClick(p)}
          onDismiss={p.dismissible ? () => { dismiss(p.id); window.dispatchEvent(new Event("promotion-dismissed")); } : undefined}
          variant={p.display_style === "card" ? "card" : p.display_style === "inline-text" ? "inline-text" : "banner"}
        />
      ))}
      <PromotionPopup promo={activePopup} open={!!activePopup} onOpenChange={(o) => !o && setActivePopup(null)} />
    </div>
  );
};

export default PromotionSlot;
