import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { downloadCSV } from "@/lib/csvExport";
import {
  PRESET_LABELS,
  presetToRange,
  formatRange,
  type DateRange,
  type PresetRange,
  type ReportConfig,
} from "./reports.types";

interface ReportShellProps<T> {
  config: ReportConfig<T>;
  /** Optional extra filter UI rendered on the toolbar. */
  extraFilters?: React.ReactNode;
  /** Optional filter summary lines that appear on the PDF header. */
  pdfFilters?: Array<{ label: string; value: string }>;
}

function toDateInputValue(d: Date) {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function ReportShell<T>({ config, extraFilters, pdfFilters }: ReportShellProps<T>) {
  const [preset, setPreset] = useState<PresetRange>(config.defaultPreset || "last30");
  const [custom, setCustom] = useState<{ from: string; to: string }>(() => {
    const r = presetToRange("last30");
    return { from: toDateInputValue(r.from), to: toDateInputValue(r.to) };
  });

  const range: DateRange = useMemo(() => {
    if (preset !== "custom") return presetToRange(preset);
    const from = new Date(custom.from + "T00:00:00");
    const to = new Date(custom.to + "T23:59:59.999");
    return { from, to, preset: "custom" };
  }, [preset, custom]);

  const queryKey = useMemo(
    () => ["report", config.filename, range.from.toISOString(), range.to.toISOString()],
    [config.filename, range.from, range.to]
  );

  const q = useQuery({
    queryKey,
    queryFn: () => config.fetcher(range),
    staleTime: 60 * 1000,
  });

  const rows = q.data || [];

  // Filter state (one value per filter key)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const setFilter = (k: string, v: string) =>
    setFilterValues((s) => ({ ...s, [k]: v }));
  const clearFilters = () => setFilterValues({});

  const filtered = useMemo(() => {
    if (!config.filters?.length) return rows;
    return rows.filter((r) =>
      config.filters!.every((f) => {
        const v = filterValues[f.key];
        if (!v || v === "all") return true;
        return f.predicate(r, v);
      })
    );
  }, [rows, config.filters, filterValues]);

  const capped =
    config.rowCap && filtered.length > config.rowCap ? filtered.slice(0, config.rowCap) : filtered;
  const kpis = config.kpis(capped);
  const activeFilterCount = Object.values(filterValues).filter((v) => v && v !== "all").length;

  const handleCSV = () => {
    if (!capped.length) {
      toast.info("Nothing to export");
      return;
    }
    downloadCSV(
      `${config.filename}_${toDateInputValue(range.from)}_${toDateInputValue(range.to)}`,
      config.columns.map((c) => ({
        header: c.header,
        accessor: c.accessor as (r: any) => any,
      })),
      capped
    );
  };

  const handlePDF = async () => {
    if (!capped.length) {
      toast.info("Nothing to export");
      return;
    }
    try {
      const { downloadReportPDF } = await import("@/lib/reportPdf");
      await downloadReportPDF({
        title: config.title,
        subtitle: config.description,
        filters: [
          { label: "Range", value: formatRange(range) },
          { label: "Rows", value: String(capped.length) },
          ...(pdfFilters || []),
        ],
        kpis,
        columns: config.columns.map((c) => c.header),
        rows: capped.map((r) => config.columns.map((c) => c.accessor(r) ?? "")),
        filename: `${config.filename}_${toDateInputValue(range.from)}_${toDateInputValue(range.to)}`,
      });
    } catch (e: any) {
      toast.error(`PDF export failed: ${e?.message || e}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCSV} disabled={!capped.length}>
            <Download className="h-4 w-4 mr-1.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handlePDF} disabled={!capped.length}>
            <FileText className="h-4 w-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${q.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-end gap-3 p-3 border border-border bg-card">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Range</label>
          <Select value={preset} onValueChange={(v) => setPreset(v as PresetRange)}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRESET_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">From</label>
              <Input
                type="date"
                className="h-9 w-40"
                value={custom.from}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">To</label>
              <Input
                type="date"
                className="h-9 w-40"
                value={custom.to}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </div>
          </>
        )}

        {extraFilters}

        <div className="ml-auto text-[11px] text-muted-foreground">{formatRange(range)}</div>
      </div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="p-3 border border-border bg-card">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</p>
              <p className="text-base font-semibold mt-0.5">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Row cap notice */}
      {config.rowCap && rows.length > config.rowCap && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle className="h-4 w-4" />
          Showing first {config.rowCap.toLocaleString()} of {rows.length.toLocaleString()} rows. Narrow your date range for a complete report.
        </div>
      )}

      {/* Table */}
      <div className="border border-border bg-card overflow-x-auto">
        {q.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : q.error ? (
          <div className="p-8 text-sm text-destructive text-center">
            {(q.error as any)?.message || "Failed to load report"}
          </div>
        ) : capped.length === 0 ? (
          <div className="p-12 text-sm text-muted-foreground text-center">
            No data for the selected range.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {config.columns.map((c) => (
                  <th
                    key={c.header}
                    className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                    style={c.width ? { width: c.width } : undefined}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capped.map((r, i) => (
                <tr key={i} className="border-t border-border hover:bg-muted/30">
                  {config.columns.map((c) => (
                    <td
                      key={c.header}
                      className={`px-3 py-2 ${c.align === "right" ? "text-right tabular-nums" : ""}`}
                    >
                      {c.accessor(r) ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        {capped.length.toLocaleString()} row{capped.length !== 1 ? "s" : ""} • {formatRange(range)}
      </p>
    </div>
  );
}
