import { ReportShell } from "./ReportShell";
import {
  fetchPromosReport,
  type PromoReportRow,
  money,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<PromoReportRow> = {
  title: "Promo Codes Report",
  description: "Promo code usages and total discount given within the date range.",
  filename: "promos_report",
  fetcher: fetchPromosReport,
  rowCap: 5000,
  columns: [
    { header: "Code", accessor: (r) => r.code },
    { header: "Type", accessor: (r) => r.type },
    { header: "Usages", accessor: (r) => r.usages, align: "right" },
    { header: "Discount Given", accessor: (r) => money(r.discount_given), align: "right" },
  ],
  kpis: (rows) => [
    { label: "Unique Codes", value: rows.length.toLocaleString() },
    { label: "Total Usages", value: rows.reduce((s, r) => s + r.usages, 0).toLocaleString() },
    { label: "Discount Given", value: money(rows.reduce((s, r) => s + r.discount_given, 0)) },
    { label: "Top Code", value: rows[0]?.code || "—" },
  ],
};

const PromosReport = () => <ReportShell config={config} />;
export default PromosReport;
