import { ReportShell } from "./ReportShell";
import {
  fetchInventoryReport,
  type InventoryReportRow,
  money,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<InventoryReportRow> = {
  title: "Inventory Report",
  description: "Warehouse entries (in/out) with quantity and purchase cost.",
  filename: "inventory_report",
  fetcher: fetchInventoryReport,
  rowCap: 5000,
  filters: [
    {
      key: "type",
      label: "Entry Type",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.type),
      predicate: (r, v) => r.type === v,
    },
    {
      key: "q",
      label: "Search Note",
      type: "search",
      placeholder: "Note contains…",
      predicate: (r, v) => r.note.toLowerCase().includes(v.toLowerCase()),
    },
  ],
  columns: [
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => r.type },
    { header: "Items", accessor: (r) => r.items, align: "right" },
    { header: "Qty", accessor: (r) => r.qty, align: "right" },
    { header: "Total Cost", accessor: (r) => money(r.total_cost), align: "right" },
    { header: "Note", accessor: (r) => r.note },
  ],
  kpis: (rows) => {
    const inRows = rows.filter((r) => /in/i.test(r.type));
    const outRows = rows.filter((r) => /out/i.test(r.type));
    return [
      { label: "Entries", value: rows.length.toLocaleString() },
      { label: "Total Qty In", value: inRows.reduce((s, r) => s + r.qty, 0).toLocaleString() },
      { label: "Total Qty Out", value: outRows.reduce((s, r) => s + r.qty, 0).toLocaleString() },
      { label: "Total Cost", value: money(rows.reduce((s, r) => s + r.total_cost, 0)) },
    ];
  },
};

const InventoryReport = () => <ReportShell config={config} />;
export default InventoryReport;
