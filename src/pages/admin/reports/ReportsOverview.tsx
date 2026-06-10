import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Wallet,
  Users,
  Package,
  Warehouse,
  Tag,
  MessageSquare,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";

interface ReportCard {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const reports: ReportCard[] = [
  {
    to: "/admin/reports/orders",
    icon: ShoppingCart,
    title: "Orders",
    description: "All orders, revenue, qty, and payment status.",
  },
  {
    to: "/admin/reports/financial",
    icon: Wallet,
    title: "Financial",
    description: "Income, expense, transfers, and net per account.",
  },
  {
    to: "/admin/reports/customers",
    icon: Users,
    title: "Customers",
    description: "New customers by district / thana.",
  },
  {
    to: "/admin/reports/products",
    icon: Package,
    title: "Products",
    description: "Best sellers and revenue per product.",
  },
  {
    to: "/admin/reports/inventory",
    icon: Warehouse,
    title: "Inventory",
    description: "Warehouse in/out entries and total cost.",
  },
  {
    to: "/admin/reports/promos",
    icon: Tag,
    title: "Promo Codes",
    description: "Usages and total discount given.",
  },
  {
    to: "/admin/reports/reviews",
    icon: MessageSquare,
    title: "Reviews",
    description: "Customer reviews, ratings, and approval status.",
  },
];

const ReportsOverview = () => {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
          <FileBarChart className="h-6 w-6" /> Reports
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate and export reports across orders, accounts, customers, and more. CSV and PDF
          export available on every report.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.to}
              to={r.to}
              className="group block border border-border bg-card p-4 hover:border-foreground transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-sm group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {r.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsOverview;
