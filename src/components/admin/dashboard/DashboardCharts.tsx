import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import type { ChartPoint } from "@/hooks/useDashboard";

export function RevenueLast7DaysChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="border border-border bg-card p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Revenue — Last 7 Days
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, false)} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            formatter={(v: number) => formatCurrency(v)}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
