import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface RecentOrder {
  id: string;
  order_number: string;
  order_status: string;
  total_amount: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  rto: "bg-orange-100 text-orange-800",
};

export default function DashboardOrdersWidget({ customerId }: { customerId: string | null }) {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customerId) { setIsLoading(false); return; }
    supabase
      .from("orders")
      .select("id, order_number, order_status, total_amount, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setOrders((data || []) as RecentOrder[]);
        setIsLoading(false);
      });
  }, [customerId]);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-5 pb-3">
        <h3 className="text-base font-semibold flex items-center gap-2 normal-case">
          <Package className="h-4 w-4" />
          Recent Orders
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigate("/my-orders")} className="text-xs normal-case">
          View All <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 normal-case">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate("/my-orders")}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium normal-case">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground normal-case">
                    {format(new Date(order.created_at), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${statusColors[order.order_status] || ""} text-xs capitalize`}>
                    {order.order_status}
                  </Badge>
                  <span className="text-sm font-semibold normal-case">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
