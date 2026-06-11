import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Package } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useComboItems } from "@/hooks/useComboItems";

export interface ComboChildSelection {
  productId: string;
  variantId?: string | null;
  name: string;
  image: string;
  sku?: string | null;
  color?: string | null;
  size?: string | null;
  quantity: number;
  unitPrice: number;
}

interface ComboConfiguratorProps {
  comboProductId: string;
  onChange: (selections: ComboChildSelection[], allConfigured: boolean) => void;
}

interface ChildState {
  colorId: string | null;
  sizeId: string | null;
  customId: string | null;
}

const mainImage = (imgs?: Array<{ image_url: string; is_main?: boolean }>) => {
  if (!imgs || imgs.length === 0) return "/placeholder.svg";
  return imgs.find((i) => i.is_main)?.image_url || imgs[0].image_url;
};

const ComboConfigurator = ({ comboProductId, onChange }: ComboConfiguratorProps) => {
  const { data: items = [], isLoading } = useComboItems(comboProductId);
  const [state, setState] = useState<Record<string, ChildState>>({});
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);

  // Open the first item automatically once loaded
  useEffect(() => {
    if (!openItem && items.length > 0) setOpenItem(items[0].id);
  }, [items, openItem]);

  // Compute selections + readiness, fire upward
  useEffect(() => {
    if (items.length === 0) {
      onChange([], false);
      return;
    }
    let allReady = true;
    const selections: ComboChildSelection[] = items.map((ci) => {
      const child = ci.child;
      const s = state[ci.id] || { colorId: null, sizeId: null, customId: null };
      const variants = (child?.variants || []).filter((v: any) => v.is_active);
      const colors = Array.from(
        new Map(variants.filter((v: any) => v.color).map((v: any) => [v.color.id, v.color])).values()
      );
      const sizes = Array.from(
        new Map(variants.filter((v: any) => v.size).map((v: any) => [v.size.id, v.size])).values()
      );
      const customs = Array.from(
        new Map(
          variants
            .filter((v: any) => v.custom_variant)
            .map((v: any) => [v.custom_variant.id, v.custom_variant])
        ).values()
      );

      const needsColor = colors.length > 0;
      const needsSize = sizes.length > 0;
      const needsCustom = customs.length > 0;

      const matched = variants.find(
        (v: any) =>
          (!needsColor || v.color?.id === s.colorId) &&
          (!needsSize || v.size?.id === s.sizeId) &&
          (!needsCustom || v.custom_variant?.id === s.customId)
      );

      const ready = !needsColor && !needsSize && !needsCustom ? true : !!matched;
      if (!ready) allReady = false;

      return {
        productId: child?.id || ci.child_product_id,
        variantId: matched?.id || null,
        name: child?.name || "Item",
        image: mainImage(child?.images as any),
        sku: matched?.sku || child?.sku || null,
        color: matched?.color?.name || null,
        size: matched?.size?.label || null,
        quantity: ci.quantity,
        unitPrice: matched?.selling_price ?? child?.base_price ?? 0,
      };
    });
    onChange(selections, allReady);
  }, [items, state, onChange]);

  const updateChild = (itemId: string, patch: Partial<ChildState>) => {
    setState((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || { colorId: null, sizeId: null, customId: null }), ...patch },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading bundle items...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border rounded p-6 text-center text-sm text-muted-foreground">
        <Package className="h-6 w-6 mx-auto mb-2 opacity-50" />
        This bundle has no items yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium uppercase tracking-wide">
          Configure your bundle
        </p>
        <span className="text-xs text-muted-foreground">
          {items.length} item{items.length > 1 ? "s" : ""}
        </span>
      </div>

      <Accordion
        type="single"
        collapsible
        value={openItem}
        onValueChange={setOpenItem}
        className="space-y-2"
      >
        {items.map((ci, idx) => {
          const child = ci.child;
          const s = state[ci.id] || { colorId: null, sizeId: null, customId: null };
          const variants = ((child?.variants as any[]) || []).filter((v) => v.is_active);

          const colors = Array.from(
            new Map(variants.filter((v) => v.color).map((v) => [v.color.id, v.color])).values()
          ) as Array<{ id: string; name: string; hex_code: string }>;
          const sizes = Array.from(
            new Map(variants.filter((v) => v.size).map((v) => [v.size.id, v.size])).values()
          ).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) as Array<{
            id: string;
            label: string;
          }>;
          const customs = Array.from(
            new Map(
              variants
                .filter((v) => v.custom_variant)
                .map((v) => [v.custom_variant.id, v.custom_variant])
            ).values()
          ) as Array<{ id: string; label: string }>;

          const needsColor = colors.length > 0;
          const needsSize = sizes.length > 0;
          const needsCustom = customs.length > 0;

          const matched = variants.find(
            (v) =>
              (!needsColor || v.color?.id === s.colorId) &&
              (!needsSize || v.size?.id === s.sizeId) &&
              (!needsCustom || v.custom_variant?.id === s.customId)
          );
          const configured = !needsColor && !needsSize && !needsCustom ? true : !!matched;

          return (
            <AccordionItem
              key={ci.id}
              value={ci.id}
              className="border border-border rounded-md overflow-hidden bg-background data-[state=open]:border-foreground/30"
            >
              <AccordionTrigger className="px-3 py-3 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                    {idx + 1}
                  </div>
                  <img
                    src={mainImage(child?.images as any)}
                    alt={child?.name || "Item"}
                    className="w-11 h-11 object-cover rounded border border-border bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium truncate">{child?.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Qty {ci.quantity}
                      {matched?.color?.name ? ` · ${matched.color.name}` : ""}
                      {matched?.size?.label ? ` · ${matched.size.label}` : ""}
                    </p>
                  </div>
                  {configured ? (
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <Check className="h-3 w-3" /> Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Select options
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform ml-1 shrink-0" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4 pt-1">
                {variants.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No options to configure — included as-is.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {needsColor && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2">Color</p>
                        <div className="flex flex-wrap gap-2">
                          {colors.map((c) => {
                            const isSelected = s.colorId === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() =>
                                  updateChild(ci.id, { colorId: isSelected ? null : c.id })
                                }
                                title={c.name}
                                className={cn(
                                  "w-9 h-9 rounded-full border-2 transition-all",
                                  isSelected
                                    ? "border-foreground ring-2 ring-offset-2 ring-foreground"
                                    : "border-border hover:border-foreground/60"
                                )}
                                style={{ backgroundColor: c.hex_code }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {needsSize && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2">Size</p>
                        <div className="flex flex-wrap gap-2">
                          {sizes.map((sz) => {
                            const isSelected = s.sizeId === sz.id;
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() =>
                                  updateChild(ci.id, { sizeId: isSelected ? null : sz.id })
                                }
                                className={cn(
                                  "min-w-12 h-9 px-3 border text-xs font-light transition-all",
                                  isSelected
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border hover:border-foreground text-foreground"
                                )}
                              >
                                {sz.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {needsCustom && (
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2">Option</p>
                        <div className="flex flex-wrap gap-2">
                          {customs.map((cv) => {
                            const isSelected = s.customId === cv.id;
                            return (
                              <button
                                key={cv.id}
                                type="button"
                                onClick={() =>
                                  updateChild(ci.id, { customId: isSelected ? null : cv.id })
                                }
                                className={cn(
                                  "min-w-12 h-9 px-3 border text-xs font-light transition-all",
                                  isSelected
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border hover:border-foreground text-foreground"
                                )}
                              >
                                {cv.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default ComboConfigurator;
