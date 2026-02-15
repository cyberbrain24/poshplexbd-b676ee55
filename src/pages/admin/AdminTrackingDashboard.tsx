import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, MousePointerClick, CreditCard, TrendingUp, Radio, Server } from "lucide-react";

interface Stats {
  purchases: number;
  addToCart: number;
  checkouts: number;
  pixelEnabled: boolean;
  capiEnabled: boolean;
}

const AdminTrackingDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    purchases: 0,
    addToCart: 0,
    checkouts: 0,
    pixelEnabled: false,
    capiEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch today's tracking events
        const { data: events } = await supabase
          .from("tracking_events")
          .select("event_type")
          .gte("created_at", today.toISOString());

        // Fetch pixel status
        const { data: settings } = await supabase
          .from("site_settings")
          .select("meta_pixel_enabled, meta_capi_enabled")
          .limit(1)
          .maybeSingle();

        const purchases = events?.filter((e) => e.event_type === "Purchase").length ?? 0;
        const addToCart = events?.filter((e) => e.event_type === "AddToCart").length ?? 0;
        const checkouts = events?.filter((e) => e.event_type === "InitiateCheckout").length ?? 0;

        setStats({
          purchases,
          addToCart,
          checkouts,
          pixelEnabled: settings?.meta_pixel_enabled ?? false,
          capiEnabled: settings?.meta_capi_enabled ?? false,
        });
      } catch {
        /* fail silently */
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const conversionRate =
    stats.checkouts > 0 ? ((stats.purchases / stats.checkouts) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { icon: ShoppingCart, label: "Today Purchases", value: stats.purchases },
    { icon: MousePointerClick, label: "Today AddToCart", value: stats.addToCart },
    { icon: CreditCard, label: "Today Checkout Started", value: stats.checkouts },
    { icon: TrendingUp, label: "Conversion Rate", value: `${conversionRate}%` },
    {
      icon: Radio,
      label: "Pixel Status",
      value: stats.pixelEnabled ? "Active" : "Disabled",
      color: stats.pixelEnabled ? "text-green-600" : "text-muted-foreground",
    },
    {
      icon: Server,
      label: "CAPI Status",
      value: stats.capiEnabled ? "Active" : "Disabled",
      color: stats.capiEnabled ? "text-green-600" : "text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Tracking Dashboard</h1>
        <p className="text-muted-foreground mt-1">Today's marketing event summary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="border border-border p-6 space-y-3">
            <card.icon className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className={`text-2xl font-semibold ${(card as any).color || ""}`}>
                {card.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTrackingDashboard;
