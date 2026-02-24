import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface BirthDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function BirthDatePicker({ value, onChange, placeholder = "Pick a date", className }: BirthDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const years = React.useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1940; y--) arr.push(y);
    return arr;
  }, [currentYear]);

  const [displayMonth, setDisplayMonth] = React.useState<Date>(value || new Date(2000, 0, 1));

  React.useEffect(() => {
    if (value) setDisplayMonth(value);
  }, [value]);

  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(displayMonth, parseInt(monthStr));
    setDisplayMonth(newDate);
  };

  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(displayMonth, parseInt(yearStr));
    setDisplayMonth(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex items-center gap-1.5 px-3 pt-3 pb-1">
          <Select value={getMonth(displayMonth).toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={getYear(displayMonth).toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()} className="text-xs">{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
