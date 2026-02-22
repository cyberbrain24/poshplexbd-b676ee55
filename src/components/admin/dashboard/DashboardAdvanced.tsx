import { formatCurrency } from "@/lib/currency";
import { SectionTitle } from "./DashboardWidgets";
import type {
  ComparisonIndicator, PerformanceEntry, TopItemWithProfit,
  InventoryRiskItem, SmartAlert, PaymentRatio,
} from "@/hooks/useDashboard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
} from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Flame, Package } from "lucide-react";

// ══════════════════════════════════════
// SMART ALERTS BAR
// ══════════════════════════════════════
export function SmartAlertsBar({ alerts }: { alerts: SmartAlert[] }) {
  if (alerts.length === 0) return null;

  const iconMap = {
    low_stock: <Package className="h-3.5 w-3.5" />,
    sales_spike: <Flame className="h-3.5 w-3.5" />,
    sales_drop: <TrendingDown className="h-3.5 w-3.5" />,
  };
  const colorMap = {
    low_stock: "border-border bg-accent text-accent-foreground",
    sales_spike: "border-border bg-accent text-accent-foreground",
    sales_drop: "border-destructive/30 bg-destructive/5 text-destructive",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-2 px-3 py-2.5 border text-xs font-medium ${colorMap[a.type]}`}>
          {iconMap[a.type]}
          <div className="min-w-0">
            <span className="font-semibold">{a.type === "low_stock" ? "⚠ Low Stock" : a.type === "sales_spike" ? "🔥 Sales Spike" : "📉 Sales Drop"}</span>
            <span className="ml-1.5 text-muted-foreground">{a.message}{a.period ? ` · ${a.period}` : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════
// COMPARISON CARD
// ══════════════════════════════════════
export function ComparisonCard({ label, value, indicators }: { label: string; value: string; indicators: ComparisonIndicator[] }) {
  return (
    <div className="border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-semibold mb-2">{value}</p>
      <div className="space-y-0.5">
        {indicators.map((ind, i) => {
          const isPositive = ind.pct >= 0;
          return (
            <div key={i} className="flex items-center gap-1 text-[11px]">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-destructive shrink-0" />
              )}
              <span className={isPositive ? "text-emerald-600" : "text-destructive"}>
                {isPositive ? "+" : ""}{ind.pct.toFixed(0)}%
              </span>
              <span className="text-muted-foreground">{ind.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// PERFORMANCE TABLE
// ══════════════════════════════════════
export function PerformanceTable({
  title,
  icon,
  periods,
  showProfit,
  showOrders,
}: {
  title: string;
  icon: string;
  periods: Record<string, PerformanceEntry | TopItemWithProfit | null>;
  showProfit?: boolean;
  showOrders?: boolean;
}) {
  const entries = Object.entries(periods);
  const hasData = entries.some(([, e]) => e !== null);
  if (!hasData) return null;

  return (
    <div className="border border-border bg-card">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {icon} {title}
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Period</TableHead>
            <TableHead className="text-xs">Name</TableHead>
            <TableHead className="text-xs text-right">Qty</TableHead>
            <TableHead className="text-xs text-right">Revenue</TableHead>
            {showProfit && <TableHead className="text-xs text-right">Profit</TableHead>}
            {showOrders && <TableHead className="text-xs text-right">Orders</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([period, entry]) => (
            <TableRow key={period}>
              <TableCell className="text-xs font-medium py-1.5">{period}</TableCell>
              <TableCell className="text-xs py-1.5">{entry?.name || "—"}</TableCell>
              <TableCell className="text-xs text-right py-1.5">{entry?.qty || 0}</TableCell>
              <TableCell className="text-xs text-right py-1.5">{formatCurrency(entry?.revenue || 0)}</TableCell>
              {showProfit && <TableCell className="text-xs text-right py-1.5">{formatCurrency((entry as TopItemWithProfit)?.profit || 0)}</TableCell>}
              {showOrders && <TableCell className="text-xs text-right py-1.5">{(entry as PerformanceEntry)?.totalOrders || 0}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ══════════════════════════════════════
// PAYMENT RATIO DONUT
// ══════════════════════════════════════
const DONUT_COLORS = ["hsl(var(--primary))", "hsl(var(--muted-foreground))"];

export function PaymentRatioChart({ data }: { data: PaymentRatio }) {
  const chartData = [
    { name: "COD", value: data.codRevenue },
    { name: "Online", value: data.onlineRevenue },
  ];
  const total = data.codRevenue + data.onlineRevenue;

  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        💳 COD vs Online Payment
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius={28} outerRadius={48} paddingAngle={2} strokeWidth={0}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={DONUT_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 11, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 text-xs flex-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-foreground" />
              <span>COD</span>
            </div>
            <span className="font-semibold">{data.codPct.toFixed(0)}% · {formatCurrency(data.codRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span>Online</span>
            </div>
            <span className="font-semibold">{data.onlinePct.toFixed(0)}% · {formatCurrency(data.onlineRevenue)}</span>
          </div>
          <div className="border-t border-border pt-1.5 flex justify-between text-muted-foreground">
            <span>Orders</span>
            <span>COD: {data.codCount} · Online: {data.onlineCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// INVENTORY HEALTH TABLE
// ══════════════════════════════════════
export function InventoryHealthSection({
  deadStock,
  slowMoving,
  fastMoving,
}: {
  deadStock: InventoryRiskItem[];
  slowMoving: InventoryRiskItem[];
  fastMoving: InventoryRiskItem[];
}) {
  return (
    <section className="space-y-4">
      <SectionTitle icon="🩺">Inventory Health Monitor</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <InventoryTable
          title="🔴 Dead Stock"
          subtitle="No sales in 30 days"
          items={deadStock}
          columns={[
            { key: "name", label: "Product" },
            { key: "stock", label: "Stock", align: "right" },
            { key: "stockValue", label: "Value", align: "right", format: "currency" },
          ]}
        />
        <InventoryTable
          title="🟡 Slow Moving"
          subtitle="≤5 sold in 30 days"
          items={slowMoving}
          columns={[
            { key: "name", label: "Product" },
            { key: "qtySold", label: "Sold", align: "right" },
            { key: "stock", label: "Stock", align: "right" },
          ]}
        />
        <InventoryTable
          title="🟢 Fast Moving"
          subtitle="Highest velocity"
          items={fastMoving}
          columns={[
            { key: "name", label: "Product" },
            { key: "qtySold", label: "Sold", align: "right" },
            { key: "daysToStockOut", label: "Days Left", align: "right" },
          ]}
        />
      </div>
    </section>
  );
}

interface ColDef {
  key: string;
  label: string;
  align?: "right";
  format?: "currency";
}

function InventoryTable({ title, subtitle, items, columns }: { title: string; subtitle: string; items: InventoryRiskItem[]; columns: ColDef[] }) {
  return (
    <div className="border border-border bg-card">
      <div className="p-3 border-b border-border">
        <h3 className="text-xs font-semibold">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground p-3">None</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={`text-[10px] ${c.align === "right" ? "text-right" : ""}`}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  {columns.map((c) => {
                    const val = (item as any)[c.key];
                    return (
                      <TableCell key={c.key} className={`text-xs py-1 ${c.align === "right" ? "text-right" : ""}`}>
                        {c.format === "currency" ? formatCurrency(val) : val}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
