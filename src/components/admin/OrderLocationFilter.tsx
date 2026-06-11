import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MapPin, X } from "lucide-react";
import { useDivisions, useThanas } from "@/hooks/useLocationData";

type Mode = "include" | "exclude";

interface Props {
  divisionIds: string[];
  thanaIds: string[];
  mode: Mode;
  onDivisionChange: (ids: string[]) => void;
  onThanaChange: (ids: string[]) => void;
  onModeChange: (m: Mode) => void;
}

export const OrderLocationFilter = ({
  divisionIds, thanaIds, mode,
  onDivisionChange, onThanaChange, onModeChange,
}: Props) => {
  const [search, setSearch] = useState("");
  const { data: divisions = [] } = useDivisions();
  // load thanas for all selected divisions (or all if none)
  const { data: thanas = [] } = useThanas(divisionIds[0]);
  // Fallback: also fetch all thanas when no division selected
  const { data: allThanas = [] } = useThanas(undefined as any);

  const visibleThanas = useMemo(() => {
    const pool = divisionIds.length > 0
      ? (thanas || []).filter((t: any) => divisionIds.includes(t.division_id))
      : (allThanas || []);
    if (!search.trim()) return pool;
    const q = search.toLowerCase();
    return pool.filter((t: any) => t.name.toLowerCase().includes(q));
  }, [thanas, allThanas, divisionIds, search]);

  const visibleDivisions = useMemo(() => {
    if (!search.trim()) return divisions;
    const q = search.toLowerCase();
    return divisions.filter((d: any) => d.name.toLowerCase().includes(q));
  }, [divisions, search]);

  const total = divisionIds.length + thanaIds.length;
  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Location
          {total > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {mode === "exclude" ? "−" : "+"}{total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => onModeChange("include")}
              className={`px-3 py-1.5 ${mode === "include" ? "bg-foreground text-background" : "bg-background"}`}
            >
              Include
            </button>
            <button
              type="button"
              onClick={() => onModeChange("exclude")}
              className={`px-3 py-1.5 ${mode === "exclude" ? "bg-foreground text-background" : "bg-background"}`}
            >
              Exclude
            </button>
          </div>
          {total > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs"
              onClick={() => {
                onDivisionChange([]);
                onThanaChange([]);
              }}
            >
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <div className="p-2 border-b">
          <Input
            placeholder="Search districts or thanas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/40">
            Districts
          </div>
          <div className="px-2 pb-2">
            {visibleDivisions.map((d: any) => (
              <label
                key={d.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded cursor-pointer"
              >
                <Checkbox
                  checked={divisionIds.includes(d.id)}
                  onCheckedChange={() => onDivisionChange(toggle(divisionIds, d.id))}
                />
                <span className="flex-1">{d.name}</span>
              </label>
            ))}
            {visibleDivisions.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">No districts</p>
            )}
          </div>
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/40">
            Thanas {divisionIds.length > 0 ? `(in selected districts)` : ""}
          </div>
          <div className="px-2 pb-2">
            {visibleThanas.map((t: any) => (
              <label
                key={t.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted/50 rounded cursor-pointer"
              >
                <Checkbox
                  checked={thanaIds.includes(t.id)}
                  onCheckedChange={() => onThanaChange(toggle(thanaIds, t.id))}
                />
                <span className="flex-1">{t.name}</span>
              </label>
            ))}
            {visibleThanas.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">No thanas</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default OrderLocationFilter;
