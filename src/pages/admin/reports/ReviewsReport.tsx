import { ReportShell } from "./ReportShell";
import {
  fetchReviewsReport,
  type ReviewReportRow,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<ReviewReportRow> = {
  title: "Reviews Report",
  description: "Customer reviews within the selected range, with rating and approval status.",
  filename: "reviews_report",
  fetcher: fetchReviewsReport,
  rowCap: 5000,
  columns: [
    { header: "Date", accessor: (r) => r.date },
    { header: "Product", accessor: (r) => r.product },
    { header: "Customer", accessor: (r) => r.customer },
    { header: "Rating", accessor: (r) => r.rating, align: "right" },
    { header: "Status", accessor: (r) => r.status },
    { header: "Comment", accessor: (r) => r.comment },
  ],
  kpis: (rows) => {
    const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
    return [
      { label: "Reviews", value: rows.length.toLocaleString() },
      { label: "Avg Rating", value: avg.toFixed(2) },
      { label: "Approved", value: rows.filter((r) => r.status === "approved").length.toLocaleString() },
      { label: "Pending", value: rows.filter((r) => r.status === "pending").length.toLocaleString() },
    ];
  },
};

const ReviewsReport = () => <ReportShell config={config} />;
export default ReviewsReport;
