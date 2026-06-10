import { ReportShell } from "./ReportShell";
import { fetchOrdersReport, type OrderReportRow, money } from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<OrderReportRow> = {
  title: "Orders Report",
  description: "All orders within the selected date range with line totals and payment status.",
  filename: "orders_report",
  fetcher: fetchOrdersReport,
  rowCap: 5000,
  columns: [
    { header: "Order #", accessor: (r) => r.order_number },
    { header: "Date", accessor: (r) => r.date },
    { header: "Customer", accessor: (r) => r.customer },
    { header: "Phone", accessor: (r) => r.phone },
    { header: "Status", accessor: (r) => r.status },
    { header: "Payment", accessor: (r) => r.payment_status },
    { header: "Qty", accessor: (r) => r.qty, align: "right" },
    { header: "Subtotal", accessor: (r) => money(r.subtotal), align: "right" },
    { header: "Shipping", accessor: (r) => money(r.shipping), align: "right" },
    { header: "Discount", accessor: (r) => money(r.discount), align: "right" },
    { header: "Total", accessor: (r) => money(r.total), align: "right" },
    { header: "Paid", accessor: (r) => money(r.paid), align: "right" },
  ],
  kpis: (rows) => {
    const counted = rows.filter((r) => r.status !== "cancelled" && r.status !== "returned");
    const revenue = counted.reduce((s, r) => s + r.total, 0);
    const qty = counted.reduce((s, r) => s + r.qty, 0);
    const paid = rows.reduce((s, r) => s + r.paid, 0);
    return [
      { label: "Orders", value: rows.length.toLocaleString() },
      { label: "Revenue", value: money(revenue) },
      { label: "Qty Sold", value: qty.toLocaleString() },
      { label: "Paid", value: money(paid) },
      { label: "Avg Order", value: money(counted.length ? revenue / counted.length : 0) },
    ];
  },
};

const OrdersReport = () => <ReportShell config={config} />;
export default OrdersReport;
