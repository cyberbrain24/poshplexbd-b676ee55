import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Filter, Loader2, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export interface PickedProduct {
  id: string;
  name: string;
}

interface Props {
  values: PickedProduct[];
  onChange: (values: PickedProduct[]) => void;
  width?: string;
}

export default function ProductMultiSelectFilter({ values, onChange, width = "w-[220px]" }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (debounced.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .or(`name.ilike.%${debounced}%,sku.ilike.%${debounced}%`)
        .limit(20);
      if (!cancelled) {
        if (!error && data) {
          setResults(data.map((p: any) => ({ id: p.id, name: p.name })));
        }
        setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  const pickedIds = useMemo(() => new Set(values.map(v => v.id)), [values]);

  const toggle = (p: PickedProduct) => {
    if (pickedIds.has(p.id)) onChange(values.filter(v => v.id !== p.id));
    else onChange([...values, p]);
  };

  const summary = values.length === 0
    ? "Products"
    : values.length === 1
      ? values[0].name
      : `Products (${values.length})`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={`${width} justify-between font-normal`}>
          <span className="flex items-center gap-2 truncate">
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{summary}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="flex items-center justify-between px-1 pb-2 border-b mb-2">
          <span className="text-xs font-medium text-muted-foreground">Filter by products</span>
          {values.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs text-primary hover:underline"
              type="button"
            >
              Clear all
            </button>
          )}
        </div>

        {values.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-2 mb-2 border-b max-h-24 overflow-y-auto">
            {values.map(v => (
              <Badge key={v.id} variant="secondary" className="text-[10px] pr-1 gap-1">
                <span className="max-w-[140px] truncate">{v.name}</span>
                <button
                  type="button"
                  onClick={() => toggle(v)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Input
          autoFocus
          placeholder="Search by name or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 text-sm mb-2"
        />

        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {loading && (
            <div className="flex items-center justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {!loading && debounced.length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Type at least 2 characters to search
            </p>
          )}
          {!loading && debounced.length >= 2 && results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No products found</p>
          )}
          {!loading && results.map(p => {
            const checked = pickedIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent text-left ${checked ? 'bg-accent/60' : ''}`}
              >
                <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{p.name}</span>
                {checked && <span className="text-[10px] text-primary font-medium">Added</span>}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
