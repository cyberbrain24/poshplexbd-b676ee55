import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Facebook, Server, BarChart3, Activity, Sparkles, Truck } from "lucide-react";

const tabs = [
  { to: "/admin/marketing", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/marketing/visitors", label: "Visitors", icon: Activity },
  { to: "/admin/marketing/meta-pixel", label: "Meta Pixel", icon: Facebook },
  { to: "/admin/marketing/meta-capi", label: "Meta CAPI", icon: Server },
  { to: "/admin/marketing/ga4", label: "Google Analytics 4", icon: BarChart3 },
  { to: "/admin/marketing/ai-providers", label: "AI Providers", icon: Sparkles },
  { to: "/admin/marketing/steadfast", label: "Steadfast API", icon: Truck },
];

const MarketingLayout = () => {
  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight uppercase">Integration & Tracking</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Configure pixels, analytics, AI provider credentials, and third-party APIs from a single hub.
        </p>
      </div>

      <div className="border-b border-border mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <Outlet />
    </div>
  );
};

export default MarketingLayout;
