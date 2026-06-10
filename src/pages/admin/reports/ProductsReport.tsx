import { ReportShell } from "./ReportShell";
import {
  fetchProductsReport,
  type ProductReportRow,
  money,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<ProductReportRow> = {
  title: "Products Report",
  description: "Best-selling products by qty and revenue (excludes cancelled / returned).",
  filename: "products_report",
  fetcher: fetchProductsReport,
  rowCap: 5000,
  filters: [
    {
      key: "q",
      label: "Search",
      type: "search",
      placeholder: "Product name or SKU",
      widthClass: "w-64",
      predicate: (r, v) => {
        const q = v.toLowerCase();
        return r.product.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q);
      },
    },
    {
      key: "minQty",
      label: "Min Qty Sold",
      type: "select",
      options: ["1", "5", "10", "25", "50", "100"],
      predicate: (r, v) => r.qty_sold >= Number(v),
    },
  ],
  columns: [
    { header: "Product", accessor: (r) => r.product },
    { header: "SKU", accessor: (r) => r.sku },
    { header: "Qty Sold", accessor: (r) => r.qty_sold, align: "right" },
    { header: "Orders", accessor: (r) => r.orders, align: "right" },
    { header: "Revenue", accessor: (r) => money(r.revenue), align: "right" },
  ],
  kpis: (rows) => {
    const qty = rows.reduce((s, r) => s + r.qty_sold, 0);
    const revenue = rows.reduce((s, r) => s + r.revenue, 0);
    return [
      { label: "Unique Items", value: rows.length.toLocaleString() },
      { label: "Total Qty", value: qty.toLocaleString() },
      { label: "Total Revenue", value: money(revenue) },
      { label: "Top Seller", value: rows[0]?.product ? rows[0].product.slice(0, 24) : "—" },
    ];
  },
};

const ProductsReport = () => <ReportShell config={config} />;
export default ProductsReport;
