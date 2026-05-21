import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";

export type ChannelStatus = "live" | "configured" | "missing" | "disabled";

const STATUS_STYLES: Record<ChannelStatus, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  configured: { label: "Ready", cls: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  missing: { label: "Missing Credentials", cls: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  disabled: { label: "Disabled", cls: "bg-muted text-muted-foreground border-border" },
};

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  status: ChannelStatus;
  href: string;
  details?: { label: string; value: string }[];
}

const ChannelStatusCard = ({ title, description, icon: Icon, status, href, details }: Props) => {
  const s = STATUS_STYLES[status];
  return (
    <Link
      to={href}
      className="group block border border-border p-5 hover:border-foreground transition-colors bg-card"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-border">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <span className={cn("text-[10px] font-medium uppercase px-2 py-1 border rounded-sm whitespace-nowrap", s.cls)}>
          {s.label}
        </span>
      </div>

      {details && details.length > 0 && (
        <dl className="mt-4 space-y-1.5 border-t border-border pt-3">
          {details.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <dt className="text-muted-foreground">{d.label}</dt>
              <dd className="font-mono text-foreground truncate ml-3 max-w-[60%] text-right">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
        Manage <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
};

export default ChannelStatusCard;
