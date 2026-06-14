import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, Eye, Globe } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type Range = "24h" | "7d" | "30d";

interface PageView {
  id: string;
  path: string;
  referrer: string | null;
  device_type: string | null;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  session_id: string | null;
  created_at: string;
}

function flagEmoji(cc?: string | null) {
  if (!cc || cc.length !== 2) return "🌐";
  const A = 0x1f1e6;
  return String.fromCodePoint(A + cc.toUpperCase().charCodeAt(0) - 65) +
         String.fromCodePoint(A + cc.toUpperCase().charCodeAt(1) - 65);
}

function rangeStart(r: Range): Date {
  const d = new Date();
  if (r === "24h") d.setHours(d.getHours() - 24);
  else if (r === "7d") d.setDate(d.getDate() - 7);
  else d.setDate(d.getDate() - 30);
  return d;
}

interface Aggregates {
  total_views: number;
  unique_visitors: number;
  timeseries: { bucket: string; visits: number; unique: number }[];
  top_pages: { path: string; count: number }[];
  top_countries: { country: string; country_code: string; count: number }[];
  devices: { device: string; count: number }[];
}

const VisitorAnalytics = () => {
  const [range, setRange] = useState<Range>("24h");
  const [views, setViews] = useState<PageView[]>([]);
  const [agg, setAgg] = useState<Aggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState<{ active: number; last_30m: number; today: number }>({ active: 0, last_30m: 0, today: 0 });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Live count poller
  useEffect(() => {
    const fetchLive = async () => {
      const { data } = await supabase.rpc("get_active_visitors_count");
      if (data) setLive(data as any);
    };
    fetchLive();
    const t = setInterval(fetchLive, 15_000);
    return () => clearInterval(t);
  }, []);

  // Aggregated analytics via RPC (handles 7d/30d without row caps)
  useEffect(() => {
    setLoading(true);
    (async () => {
      const [aggRes, recentRes] = await Promise.all([
        (supabase.rpc as any)("get_visitor_analytics", { p_range: range }),
        supabase
          .from("page_views")
          .select("id, path, referrer, device_type, ip_address, country, country_code, city, session_id, created_at")
          .gte("created_at", rangeStart(range).toISOString())
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      setAgg((aggRes.data as any) || null);
      setViews(recentRes.data || []);
      setLoading(false);
    })();
  }, [range]);

  const stats = useMemo(() => ({
    total: agg?.total_views || 0,
    unique: agg?.unique_visitors || 0,
  }), [agg]);

  const chartData = useMemo(() => {
    if (!agg?.timeseries) return [];
    return agg.timeseries.map((b) => ({
      time: range === "24h"
        ? new Date(b.bucket).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : new Date(b.bucket).toLocaleDateString([], { month: "short", day: "numeric" }),
      Visits: b.visits,
      Unique: b.unique,
    }));
  }, [agg, range]);

  const topPages = useMemo<[string, number][]>(
    () => (agg?.top_pages || []).map((p) => [p.path, p.count]),
    [agg]
  );

  const topCountries = useMemo<[string, { count: number; cc: string }][]>(
    () => (agg?.top_countries || []).map((c) => [c.country, { count: c.count, cc: c.country_code }]),
    [agg]
  );

  const deviceSplit = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    (agg?.devices || []).forEach((d) => { m[d.device] = d.count; });
    return m;
  }, [agg]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return views;
    return views.filter((v) =>
      (v.ip_address || "").toLowerCase().includes(q) ||
      (v.country || "").toLowerCase().includes(q) ||
      (v.city || "").toLowerCase().includes(q) ||
      (v.path || "").toLowerCase().includes(q)
    );
  }, [views, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold uppercase tracking-tight">Visitor Analytics</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Live traffic, geography, and recent visits.</p>
        </div>
        <div className="flex gap-1 border rounded-md p-1">
          {(["24h", "7d", "30d"] as Range[]).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "default" : "ghost"}
              className="h-7 px-3 text-xs uppercase"
              onClick={() => { setRange(r); setPage(1); }}
            >{r}</Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-green-600" />
            Live Now
            <span className="ml-auto relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
          </div>
          <div className="text-2xl font-bold mt-1">{live.active}</div>
          <div className="text-[11px] text-muted-foreground">last 5 min</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Today
          </div>
          <div className="text-2xl font-bold mt-1">{live.today}</div>
          <div className="text-[11px] text-muted-foreground">unique visitors</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Page Views
          </div>
          <div className="text-2xl font-bold mt-1">{stats.total.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">in selected range</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <Globe className="h-3.5 w-3.5" /> Unique Visitors
          </div>
          <div className="text-2xl font-bold mt-1">{stats.unique.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">in selected range</div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-4">
        <div className="text-xs uppercase text-muted-foreground mb-3">Traffic over time</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2f2f2f" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#2f2f2f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" fontSize={11} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="Visits" stroke="#2f2f2f" fill="url(#vGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="Unique" stroke="#888" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground mb-3">Top Pages</div>
          <div className="space-y-2">
            {topPages.map(([p, c]) => (
              <div key={p} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[70%]" title={p}>{p}</span>
                <Badge variant="secondary">{c}</Badge>
              </div>
            ))}
            {topPages.length === 0 && <div className="text-xs text-muted-foreground">No data</div>}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground mb-3">Top Countries</div>
          <div className="space-y-2">
            {topCountries.map(([name, v]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{flagEmoji(v.cc)}</span>
                  {name}
                </span>
                <Badge variant="secondary">{v.count}</Badge>
              </div>
            ))}
            {topCountries.length === 0 && <div className="text-xs text-muted-foreground">No data</div>}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase text-muted-foreground mb-3">Devices</div>
          <div className="space-y-2">
            {Object.entries(deviceSplit).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm capitalize">
                <span>{k}</span>
                <Badge variant="secondary">{v}</Badge>
              </div>
            ))}
            {Object.keys(deviceSplit).length === 0 && <div className="text-xs text-muted-foreground">No data</div>}
          </div>
        </Card>
      </div>

      {/* Live visits table */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-xs uppercase text-muted-foreground">Recent Visits</div>
          <Input
            placeholder="Search IP, country, city, path…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs h-8 text-xs"
          />
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground uppercase">
              <tr className="border-b">
                <th className="text-left py-2 pr-3 font-medium">Time</th>
                <th className="text-left py-2 pr-3 font-medium">Location</th>
                <th className="text-left py-2 pr-3 font-medium">IP</th>
                <th className="text-left py-2 pr-3 font-medium">Path</th>
                <th className="text-left py-2 pr-3 font-medium">Device</th>
                <th className="text-left py-2 pr-3 font-medium">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No visits yet</td></tr>
              )}
              {pageRows.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(v.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    <span className="mr-1">{flagEmoji(v.country_code)}</span>
                    {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono">{v.ip_address || "—"}</td>
                  <td className="py-2 pr-3 max-w-[240px] truncate" title={v.path}>{v.path}</td>
                  <td className="py-2 pr-3 capitalize">{v.device_type || "—"}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate text-muted-foreground" title={v.referrer || ""}>{v.referrer || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs">
          <span className="text-muted-foreground">
            {filtered.length.toLocaleString()} visits · page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-7">Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-7">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VisitorAnalytics;
