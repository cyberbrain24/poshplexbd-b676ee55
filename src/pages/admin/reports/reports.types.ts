/**
 * Shared types and helpers for the Reports module.
 */

export interface DateRange {
  from: Date;
  to: Date;
  preset: PresetRange;
}

export type PresetRange =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export const PRESET_LABELS: Record<PresetRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 Days",
  last30: "Last 30 Days",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  custom: "Custom Range",
};

export function presetToRange(preset: PresetRange): DateRange {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  switch (preset) {
    case "today":
      return { from: startOfToday, to: endOfToday, preset };
    case "yesterday": {
      const from = new Date(startOfToday.getTime() - 86400000);
      const to = new Date(startOfToday.getTime() - 1);
      return { from, to, preset };
    }
    case "last7": {
      const from = new Date(startOfToday.getTime() - 6 * 86400000);
      return { from, to: endOfToday, preset };
    }
    case "last30": {
      const from = new Date(startOfToday.getTime() - 29 * 86400000);
      return { from, to: endOfToday, preset };
    }
    case "thisMonth": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: endOfToday, preset };
    }
    case "lastMonth": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from, to, preset };
    }
    case "custom":
    default:
      return { from: startOfToday, to: endOfToday, preset };
  }
}

export function formatRange(r: DateRange): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" });
  return `${fmt(r.from)} → ${fmt(r.to)}`;
}

export interface ReportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
  align?: "left" | "right";
  width?: string;
}

export interface ReportKPI {
  label: string;
  value: string;
}

export interface ReportFilter<T> {
  key: string;
  label: string;
  /** "select" = dropdown of values, "search" = free-text contains match. */
  type: "select" | "search";
  /** For select: provide static options, OR derive from rows. */
  options?: string[];
  deriveOptions?: (rows: T[]) => string[];
  /** Predicate returning true to keep the row. Value "" / "all" means no filter. */
  predicate: (row: T, value: string) => boolean;
  /** Optional placeholder for search inputs. */
  placeholder?: string;
  /** Width class override (default w-40). */
  widthClass?: string;
}

export interface ReportConfig<T> {
  title: string;
  description: string;
  filename: string;
  fetcher: (range: DateRange) => Promise<T[]>;
  columns: ReportColumn<T>[];
  kpis: (rows: T[]) => ReportKPI[];
  defaultPreset?: PresetRange;
  /** Hard cap; rows beyond this are clipped with a warning. */
  rowCap?: number;
  /** Business filters applied client-side after fetch. */
  filters?: ReportFilter<T>[];
}
