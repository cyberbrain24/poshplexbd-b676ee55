import { useState, useEffect, useMemo } from "react";
import { Search, Trash2, Plus, Minus, Package, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useComboItems,
  useComboCandidateSearch,
  ComboItemInput,
} from "@/hooks/useComboItems";
import type { Product } from "@/types/product";
import { useDebounce } from "@/utils/performance";

export interface ComboChildState {
  child_product_id: string;
  name: string;
  sku: string;
  base_price: number;
  image: string;
  quantity: number;
}

interface ComboBuilderProps {
  /** Existing parent product id (undefined when creating new). */
  parentProductId?: string;
  /** Current combo children state (controlled). */
  value: ComboChildState[];
  onChange: (next: ComboChildState[]) => void;
}

const mainImage = (p: Product | { images?: Array<{ image_url: string; is_main?: boolean; sort_order?: number }> }) => {
  const imgs = (p as any).images || [];
  const main = imgs.find((i: any) => i.is_main);
  return (main?.image_url || imgs[0]?.image_url || "/placeholder.svg") as string;
};

const ComboBuilder = ({ parentProductId, value, onChange }: ComboBuilderProps) => {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);

  // Hydrate from DB when editing an existing combo (only if parent has no local state yet)
  const { data: existingItems, isLoading: loadingExisting } = useComboItems(parentProductId);
  useEffect(() => {
    if (!parentProductId) return;
    if (value.length > 0) return;
    if (!existingItems || existingItems.length === 0) return;
    onChange(
      existingItems.map((ci) => ({
        child_product_id: ci.child_product_id,
        name: ci.child?.name || "Product",
        sku: ci.child?.sku || "",
        base_price: ci.child?.base_price || 0,
        image: ci.child ? mainImage(ci.child) : "/placeholder.svg",
        quantity: ci.quantity,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingItems, parentProductId]);

  const { data: candidates = [], isLoading: searching } = useComboCandidateSearch(
    debounced,
    parentProductId
  );

  const selectedIds = useMemo(() => new Set(value.map((v) => v.child_product_id)), [value]);

  const addProduct = (p: Product) => {
    if (selectedIds.has(p.id)) return;
    onChange([
      ...value,
      {
        child_product_id: p.id,
        name: p.name,
        sku: p.sku,
        base_price: p.base_price,
        image: mainImage(p),
        // First item is locked at qty 1 per spec; subsequent default 1 but editable
        quantity: 1,
      },
    ]);
    setSearch("");
  };

  const updateQty = (id: string, delta: number) => {
    onChange(
      value.map((v) =>
        v.child_product_id === id
          ? { ...v, quantity: Math.max(1, v.quantity + delta) }
          : v
      )
    );
  };

  const remove = (id: string) => {
    onChange(value.filter((v) => v.child_product_id !== id));
  };

  const itemsTotal = value.reduce((s, v) => s + v.base_price * v.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h3 className="font-medium text-base">Combo / Bundle Builder</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Search and add existing products to this bundle. Stock and variants stay
            attached to each child product — customers will configure them on the
            product page.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="pl-9"
          />
          {search.trim().length >= 2 && (
            <div className="absolute z-20 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
              {searching ? (
                <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No products found</div>
              ) : (
                candidates.map((p) => {
                  const already = selectedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={already}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed text-left transition-colors"
                    >
                      <img
                        src={mainImage(p)}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded border border-border bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          SKU: {p.sku} · ৳{p.base_price.toLocaleString()} ·{" "}
                          {p.product_type}
                        </p>
                      </div>
                      {already ? (
                        <span className="text-xs text-muted-foreground">Added</span>
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            Bundle Items{" "}
            <span className="text-muted-foreground font-normal">
              ({value.length})
            </span>
          </Label>
          {value.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Items value: <strong className="text-foreground">৳{itemsTotal.toLocaleString()}</strong>
            </span>
          )}
        </div>

        {loadingExisting && parentProductId ? (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground rounded-md">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading bundle items...
          </div>
        ) : value.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground rounded-md">
            <Package className="h-7 w-7 mx-auto mb-2 opacity-50" />
            <p>No products added yet</p>
            <p className="text-xs mt-1">Search above to add existing products to this combo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {value.map((item, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={item.child_product_id}
                  className="flex items-center gap-3 p-3 border border-border rounded-md bg-background hover:border-foreground/30 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground shrink-0">
                    {idx + 1}
                  </div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded border border-border bg-muted shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      SKU: {item.sku} · ৳{item.base_price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity stepper (first item locked at 1 per spec) */}
                  <div className="flex items-center border border-border rounded">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none"
                      disabled={isFirst || item.quantity <= 1}
                      onClick={() => updateQty(item.child_product_id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 text-xs font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none"
                      disabled={isFirst}
                      onClick={() => updateQty(item.child_product_id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(item.child_product_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboBuilder;

/**
 * Map the local UI state to the persistence shape expected by useSyncComboItems.
 */
export const toComboItemInputs = (state: ComboChildState[]): ComboItemInput[] =>
  state.map((s, idx) => ({
    child_product_id: s.child_product_id,
    quantity: s.quantity,
    sort_order: idx,
  }));
