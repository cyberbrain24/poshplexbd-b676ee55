import { ShoppingBag, DollarSign, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface SummaryCardsProps {
  totalOrders: number;
  totalSpent: number;
  membershipType: string;
  addressCount?: number;
}

const cards = [
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "spent", label: "Spent", icon: DollarSign },
  { key: "membership", label: "Member", icon: Crown },
] as const;

export default function DashboardSummaryCards({ totalOrders, totalSpent, membershipType }: SummaryCardsProps) {
  const values: Record<string, string> = {
    orders: String(totalOrders),
    spent: formatCurrency(totalSpent),
    membership: membershipType,
  };

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="bg-foreground text-background rounded-[14px] p-4 sm:p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98]"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-background/10 flex items-center justify-center mb-2">
              <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-background/80" />
            </div>
            <p className="text-[11px] sm:text-xs text-background/50 font-medium tracking-wide normal-case mb-1">{card.label}</p>
            <p className="text-base sm:text-lg font-bold text-background truncate w-full normal-case leading-tight">{values[card.key]}</p>
            <div className="w-6 h-[1px] bg-background/20 mt-2" />
          </div>
        );
      })}
    </div>
  );
}
