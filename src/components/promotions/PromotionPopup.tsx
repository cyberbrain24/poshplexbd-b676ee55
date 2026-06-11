import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Promotion } from "@/hooks/usePromotions";
import { Link } from "react-router-dom";

interface Props {
  promo: Promotion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PromotionPopup = ({ promo, open, onOpenChange }: Props) => {
  const [copied, setCopied] = useState(false);
  if (!promo) return null;

  const code = promo.promo_code?.code;

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Promo code copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {promo.image_url && (
          <img src={promo.image_url} alt={promo.title} className="w-full h-48 object-cover" />
        )}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">{promo.title}</DialogTitle>
            {promo.subtitle && (
              <DialogDescription className="text-sm">{promo.subtitle}</DialogDescription>
            )}
          </DialogHeader>

          {promo.description && (
            <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">{promo.description}</p>
          )}

          {code && (
            <div className="mt-5 border-2 border-dashed border-foreground/30 rounded-lg p-3 flex items-center justify-between bg-muted/40">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-muted-foreground">Use code</p>
                <p className="text-lg font-bold tracking-wider">{code}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copy} className="gap-1">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}

          {promo.action_value && promo.action_type === "url" && (
            <a href={promo.action_value} target="_blank" rel="noreferrer" className="mt-4 block">
              <Button className="w-full">{promo.cta_label || "Learn More"}</Button>
            </a>
          )}
          {promo.action_value && promo.action_type === "product" && (
            <Link to={`/product/${promo.action_value}`} onClick={() => onOpenChange(false)} className="mt-4 block">
              <Button className="w-full">{promo.cta_label || "Shop Now"}</Button>
            </Link>
          )}
          {promo.action_value && promo.action_type === "category" && (
            <Link to={`/category/${promo.action_value}`} onClick={() => onOpenChange(false)} className="mt-4 block">
              <Button className="w-full">{promo.cta_label || "Shop Collection"}</Button>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionPopup;
