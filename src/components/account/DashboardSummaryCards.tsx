import { ShoppingBag, DollarSign, Crown, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface SummaryCardsProps {
  totalOrders: number;
  totalSpent: number;
  membershipType: string;
  addressCount: number;
}

const cards = [
  { key: "orders", label: "Total Orders", icon: ShoppingBag },
  { key: "spent", label: "Total Spent", icon: DollarSign },
  { key: "membership", label: "Membership", icon: Crown },
  { key: "addresses", label: "Active Addresses", icon: MapPin },
] as const;

export default function DashboardSummaryCards({ totalOrders, totalSpent, membershipType, addressCount }: SummaryCardsProps) {
  const values: Record<string, string> = {
    orders: String(totalOrders),
    spent: formatCurrency(totalSpent),
    membership: membershipType,
    addresses: String(addressCount),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider normal-case">{card.label}</p>
              <p className="text-lg font-bold text-foreground truncate normal-case">{values[card.key]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
