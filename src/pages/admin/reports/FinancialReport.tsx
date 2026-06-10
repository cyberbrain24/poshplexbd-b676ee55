import { ReportShell } from "./ReportShell";
import {
  fetchFinancialReport,
  type FinancialReportRow,
  money,
} from "@/services/reports.service";
import type { ReportConfig } from "./reports.types";

const config: ReportConfig<FinancialReportRow> = {
  title: "Financial Report",
  description: "Income, expense, and transfer ledger across all accounts.",
  filename: "financial_report",
  fetcher: fetchFinancialReport,
  rowCap: 5000,
  filters: [
    {
      key: "type",
      label: "Type",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.type),
      predicate: (r, v) => r.type === v,
    },
    {
      key: "account",
      label: "Account",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.account),
      predicate: (r, v) => r.account === v,
    },
    {
      key: "category",
      label: "Category",
      type: "select",
      deriveOptions: (rows) => rows.map((r) => r.category),
      predicate: (r, v) => r.category === v,
    },
    {
      key: "q",
      label: "Search",
      type: "search",
      placeholder: "Reference / notes",
      predicate: (r, v) => r.reference.toLowerCase().includes(v.toLowerCase()),
    },
  ],
  columns: [
    { header: "Date", accessor: (r) => r.date },
    { header: "Type", accessor: (r) => r.type },
    { header: "Account", accessor: (r) => r.account },
    { header: "Category", accessor: (r) => r.category },
    { header: "Reference", accessor: (r) => r.reference },
    { header: "Amount", accessor: (r) => money(r.amount), align: "right" },
  ],
  kpis: (rows) => {
    const income = rows
      .filter((r) => /income|in/i.test(r.type))
      .reduce((s, r) => s + r.amount, 0);
    const expense = rows
      .filter((r) => /expense|out/i.test(r.type))
      .reduce((s, r) => s + r.amount, 0);
    return [
      { label: "Transactions", value: rows.length.toLocaleString() },
      { label: "Income", value: money(income) },
      { label: "Expense", value: money(expense) },
      { label: "Net", value: money(income - expense) },
    ];
  },
};

const FinancialReport = () => <ReportShell config={config} />;
export default FinancialReport;
