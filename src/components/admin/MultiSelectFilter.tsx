import { Check, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  width?: string;
}

export default function MultiSelectFilter({ label, options, values, onChange, width = "w-[200px]" }: Props) {
  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter(x => x !== v));
    else onChange([...values, v]);
  };

  const summary = values.length === 0
    ? label
    : values.length === 1
      ? options.find(o => o.value === values[0])?.label || label
      : `${label} (${values.length})`;

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
      <PopoverContent className="w-64 p-2" align="start">
        <div className="flex items-center justify-between px-1 pb-2 border-b mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {values.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-xs text-primary hover:underline"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto space-y-0.5">
          {options.map(opt => {
            const checked = values.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent text-left"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="flex-1 truncate">{opt.label}</span>
                {checked && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 mt-2 border-t">
            {values.map(v => {
              const opt = options.find(o => o.value === v);
              if (!opt) return null;
              return (
                <Badge key={v} variant="secondary" className="text-[10px]">
                  {opt.label}
                </Badge>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
