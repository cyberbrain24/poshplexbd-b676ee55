import { ReportShell } from "./ReportShell";
import {
  fetchCustomersReport,
  type CustomerReportRow,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<CustomerReportRow> = {
  title: "Customers Report",
  description: "New customers registered within the selected range.",
  filename: "customers_report",
  fetcher: fetchCustomersReport,
  rowCap: 5000,
  columns: [
    { header: "Name", accessor: (r) => r.name },
    { header: "Phone", accessor: (r) => r.phone },
    { header: "Email", accessor: (r) => r.email },
    { header: "District", accessor: (r) => r.district },
    { header: "Thana", accessor: (r) => r.thana },
    { header: "Joined", accessor: (r) => r.created },
  ],
  kpis: (rows) => [
    { label: "New Customers", value: rows.length.toLocaleString() },
    {
      label: "Districts",
      value: new Set(rows.map((r) => r.district).filter((d) => d !== "—")).size.toLocaleString(),
    },
    {
      label: "Thanas",
      value: new Set(rows.map((r) => r.thana).filter((d) => d !== "—")).size.toLocaleString(),
    },
  ],
};

const CustomersReport = () => <ReportShell config={config} />;
export default CustomersReport;
