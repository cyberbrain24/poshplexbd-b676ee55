import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFeaturedProductsAdmin, useSaveFeaturedOrder, useToggleFeatured } from "@/hooks/useProducts";
import type { Product } from "@/types/product";
import { toast } from "sonner";

const HOMEPAGE_SLOTS = 10;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FeaturedProductsPanel = ({ isOpen, onClose }: Props) => {
  const { data: featured, isLoading } = useFeaturedProductsAdmin();
  const saveOrder = useSaveFeaturedOrder();
  const toggleFeatured = useToggleFeatured();

  const [items, setItems] = useState<Product[]>([]);
  const [dirty, setDirty] = useState(false);
  const [positionDraft, setPositionDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (featured) {
      setItems(featured);
      setDirty(false);
      setPositionDraft({});
    }
  }, [featured]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setDirty(true);
    setPositionDraft({});
  };

  const applyPosition = (id: string, raw: string) => {
    const target = parseInt(raw, 10);
    const from = items.findIndex((p) => p.id === id);
    if (Number.isNaN(target) || from === -1) {
      setPositionDraft((prev) => ({ ...prev, [id]: "" }));
      return;
    }
    const to = Math.min(Math.max(target, 1), items.length) - 1;
    move(from, to);
  };

  const handleSave = async () => {
    try {
      await saveOrder.mutateAsync(items.map((p) => p.id));
      toast.success("Featured order saved");
      setDirty(false);
    } catch {
      toast.error("Failed to save order");
    }
  };

  const handleUnfeature = async (id: string) => {
    try {
      await toggleFeatured.mutateAsync({ id, value: false });
      toast.success("Removed from featured");
    } catch {
      toast.error("Failed to update product");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Featured Products Order</DialogTitle>
          <DialogDescription>
            Type a position number or use the arrows. The homepage shows the first {HOMEPAGE_SLOTS} active products.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            <Package className="h-7 w-7 mx-auto mb-2" />
            No featured products yet. Use the star icon in the product list.
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((product, index) => (
              <div
                key={product.id}
                className={`flex items-center gap-3 border border-border p-2 ${
                  index >= HOMEPAGE_SLOTS ? "opacity-60" : ""
                }`}
              >
                <Input
                  type="number"
                  min={1}
                  max={items.length}
                  className="w-16 h-8 text-center"
                  value={positionDraft[product.id] ?? String(index + 1)}
                  onChange={(e) =>
                    setPositionDraft((prev) => ({ ...prev, [product.id]: e.target.value }))
                  }
                  onBlur={(e) => applyPosition(product.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyPosition(product.id, (e.target as HTMLInputElement).value);
                  }}
                />
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].image_url}
                    alt={product.name}
                    className="w-9 h-9 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
                </div>
                {!product.is_active && <Badge variant="outline">Inactive</Badge>}
                {index >= HOMEPAGE_SLOTS && <Badge variant="secondary">Not shown</Badge>}
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" onClick={() => move(index, index - 1)} disabled={index === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => move(index, index + 1)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Remove from featured"
                    onClick={() => handleUnfeature(product.id)}
                  >
                    <Star className="h-4 w-4 fill-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!dirty || saveOrder.isPending}>
            {saveOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeaturedProductsPanel;
