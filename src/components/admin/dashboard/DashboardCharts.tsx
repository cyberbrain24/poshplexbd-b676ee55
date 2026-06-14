import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import type { ChartPoint } from "@/hooks/useDashboard";
import type { DailyVisitPoint } from "@/services/dashboard.service";

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

export function DailyVisitsChart({ data }: { data: DailyVisitPoint[] }) {
  const total = data.reduce((sum, d) => sum + d.visits, 0);
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));
  return (
    <div className="border border-border bg-card p-4">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overall Daily Visits — Last 30 Days
        </h3>
        <span className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={formatted} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            formatter={(v: number) => [`${v.toLocaleString()} visits`, "Visits"]}
            labelFormatter={(l) => `${l}`}
          />
          <Area
            type="monotone"
            dataKey="visits"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#visitsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
