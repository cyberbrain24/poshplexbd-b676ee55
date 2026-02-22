import { formatCurrency } from "@/lib/currency";
import type { PeriodMetrics, TopItem, StockByCategory } from "@/hooks/useDashboard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ── KPI Card ── */
interface KPIProps {
  label: string;
  value: string | number;
  sub?: string;
}

export function KPICard({ label, value, sub }: KPIProps) {
  return (
    <div className="p-4 border border-border bg-card">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-semibold leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Section Title ── */
export function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      {icon && <span>{icon}</span>}
      {children}
    </h2>
  );
}

/* ── Order Period Card ── */
export function OrderPeriodCard({ title, data }: { title: string; data: PeriodMetrics }) {
  return (
    <div className="border border-border bg-card p-4 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <Metric label="Orders" value={data.totalOrders} />
        <Metric label="Customers" value={data.totalCustomers} />
        <Metric label="Qty Sold" value={data.totalQtySold} />
        <Metric label="Order Amt" value={formatCurrency(data.totalAmount)} />
        <Metric label="Revenue" value={formatCurrency(data.revenue)} />
        <Metric label="Profit" value={formatCurrency(data.profit)} highlight={data.profit} />
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string | number; highlight?: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight !== undefined ? (highlight >= 0 ? "text-emerald-600" : "text-destructive") : ""}>
        {value}
      </span>
    </div>
  );
}

/* ── Status Card ── */
export function StatusCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-3 border border-border bg-card text-center">
      <p className="text-lg font-semibold">{count}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

/* ── Top Items Table ── */
export function TopItemsTable({ title, items, revenueLabel = "Revenue" }: { title: string; items: TopItem[]; revenueLabel?: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No data available</p>;
  return (
    <div className="border border-border bg-card">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">{revenueLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-medium py-2">{item.name}</TableCell>
              <TableCell className="text-sm text-right py-2">{item.qty}</TableCell>
              <TableCell className="text-sm text-right py-2">{formatCurrency(item.revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Stock by Category Table ── */
export function StockByCategoryTable({ data }: { data: StockByCategory[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">No categories</p>;
  return (
    <div className="border border-border bg-card">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">📂 Stock by Category</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs text-right">Products</TableHead>
            <TableHead className="text-xs text-right">Variants</TableHead>
            <TableHead className="text-xs text-right">Stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-sm font-medium py-2">{row.name}</TableCell>
              <TableCell className="text-sm text-right py-2">{row.totalProducts}</TableCell>
              <TableCell className="text-sm text-right py-2">{row.totalVariants}</TableCell>
              <TableCell className="text-sm text-right py-2">{row.totalStock}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
