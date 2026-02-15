import { User, MapPin, Package, Crown, MessageSquare, Key, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardSection = "profile" | "addresses" | "orders" | "membership" | "reviews" | "security";

const navItems: { id: DashboardSection; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "addresses", label: "Saved Addresses", icon: MapPin },
  { id: "orders", label: "Orders", icon: Package },
  { id: "membership", label: "Membership", icon: Crown },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "security", label: "Security", icon: Key },
];

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
  displayName: string;
  profileImageUrl?: string | null;
  membershipType: string;
}

export default function DashboardSidebar({
  activeSection,
  onSectionChange,
  onLogout,
  displayName,
  profileImageUrl,
  membershipType,
}: DashboardSidebarProps) {
  return (
    <aside className="w-full space-y-1">
      {/* Mini profile */}
      <div className="flex items-center gap-3 p-4 mb-2">
        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate normal-case">{displayName}</p>
          <p className="text-xs text-muted-foreground normal-case">{membershipType}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors normal-case",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pt-4 border-t border-border mt-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors normal-case"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
