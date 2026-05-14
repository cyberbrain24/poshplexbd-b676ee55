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

export function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      {icon && <span>{icon}</span>}
      {children}
    </h2>
  );
}

export function StatusCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="p-3 border border-border bg-card text-center">
      <p className="text-lg font-semibold">{count}</p>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
