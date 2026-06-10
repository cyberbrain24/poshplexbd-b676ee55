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
  filters: [
    {
      key: "district",
      label: "District",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.district),
      predicate: (r, v) => r.district === v,
    },
    {
      key: "thana",
      label: "Thana",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.thana),
      predicate: (r, v) => r.thana === v,
    },
    {
      key: "q",
      label: "Search",
      type: "search",
      placeholder: "Name, phone, email",
      widthClass: "w-56",
      predicate: (r, v) => {
        const q = v.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.phone.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
        );
      },
    },
  ],
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
