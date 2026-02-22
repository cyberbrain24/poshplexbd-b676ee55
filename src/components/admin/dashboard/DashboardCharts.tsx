import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import type { ChartPoint } from "@/hooks/useDashboard";

const tooltipStyle = {
  contentStyle: { fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" },
};

/* ── Revenue Last 7 Days ── */
export function RevenueLast7DaysChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Revenue Trend — Last 7 Days
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, false)} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Revenue Last 12 Months ── */
export function RevenueLast12MonthsChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Revenue Trend — Last 12 Months
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, false)} />
          <Tooltip {...tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
          <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Orders Last 7 Days ── */
export function OrdersLast7DaysChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Orders Trend — Last 7 Days
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="orders" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
