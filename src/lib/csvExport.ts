/**
 * Minimal CSV exporter — no deps.
 * Builds a CSV blob from rows and triggers a browser download.
 */

export type CSVValue = string | number | boolean | null | undefined;
export interface CSVColumn<T = any> {
  header: string;
  accessor: (row: T) => CSVValue;
}

function escape(v: CSVValue): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCSV<T>(columns: CSVColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escape(c.accessor(r))).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadCSV<T>(filename: string, columns: CSVColumn<T>[], rows: T[]) {
  const csv = buildCSV(columns, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
