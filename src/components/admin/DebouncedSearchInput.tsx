/**
 * Debounced Search Input Component
 * Prevents rapid-fire API calls while typing
 */

import { useState, useEffect, memo } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  inputClassName?: string;
  showClear?: boolean;
  autoFocus?: boolean;
}

const DebouncedSearchInput = memo(function DebouncedSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  delay = 300,
  className,
  inputClassName,
  showClear = true,
  autoFocus = false,
}: DebouncedSearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce the onChange callback
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, delay, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className={cn("pl-9 pr-9", inputClassName)}
        autoFocus={autoFocus}
      />
      {showClear && localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          onClick={handleClear}
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Clear search</span>
        </Button>
      )}
    </div>
  );
});

export default DebouncedSearchInput;
