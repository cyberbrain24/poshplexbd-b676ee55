import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { PackageCheck, Search, Copy, Phone, MapPin, Loader2, Inbox, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { updateOrderStatus } from "@/services/order.service";
import OrderDetailModal from "@/components/admin/OrderDetailModal";

type StatusFilter = "not_ready" | "ready";

interface FulfillmentItem {
  id: string;
  product_id: string | null;
  product_name: string;
  variant_sku: string | null;
  variant_details: Record<string, unknown> | null;
  quantity: number;
  unit_price: number;
  product?: {
    id: string;
    images: { image_url: string; sort_order: number }[] | null;
  } | null;
}

interface FulfillmentOrder {
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  payment_method_type: string | null;
  total_amount: number;
  consignment_id: string | null;
  created_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_division: { name: string } | null;
  shipping_thana: { name: string } | null;
  items: FulfillmentItem[];
}

const PAGE_SIZE = 20;

const AdminOrderFulfillment = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("not_ready");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fulfillment-orders", statusFilter, search],
    queryFn: async () => {
      const statuses: ("confirmed" | "processing")[] = statusFilter === "not_ready" ? ["confirmed"] : ["processing"];

      let q = supabase
        .from("orders")
        .select(
          `
          id, order_number, order_status, payment_status, total_amount,
          payment_method_type, consignment_id, created_at,
          shipping_name, shipping_phone, shipping_address,
          shipping_division:divisions(name),
          shipping_thana:thanas(name),
          items:order_items(
            id, product_id, product_name, variant_sku, variant_details, quantity, unit_price,
            product:products(id, images:product_images(image_url, sort_order))
          )
        `,
          { count: "exact" }
        )
        .in("order_status", statuses)
        .is("consignment_id", null)
        .order("created_at", { ascending: true })
        .limit(PAGE_SIZE);

      if (search.trim()) {
        const s = search.trim();
        q = q.or(
          `order_number.ilike.%${s}%,shipping_name.ilike.%${s}%,shipping_phone.ilike.%${s}%`
        );
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { orders: (data || []) as unknown as FulfillmentOrder[], count: count || 0 };
    },
  });

  const markReady = useMutation({
    mutationFn: async (orderId: string) => {
      await updateOrderStatus(
        orderId,
        "processing",
        "Marked as Ready from Fulfillment module"
      );
    },
    onSuccess: () => {
      toast.success("Order marked as Ready");
      qc.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    },
  });

  const orders = data?.orders ?? [];

  const filterConfig: { key: StatusFilter; label: string }[] = [
    { key: "not_ready", label: "Mark as not Ready" },
    { key: "ready", label: "Mark as Ready" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck className="w-6 h-6" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Fulfillment</h1>
            <p className="text-sm text-muted-foreground">
              Pack & prepare orders before sending to courier
            </p>
          </div>
          <Badge variant="secondary" className="ml-2">
            {data?.count ?? 0}
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterConfig.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={statusFilter === f.key ? "default" : "outline"}
              onClick={() => setStatusFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="PO / phone / name"
              className="pl-8 h-9 w-56"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="border rounded-xl p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
          <Inbox className="w-10 h-10 opacity-50" />
          <p className="font-medium">
            {statusFilter === "not_ready"
              ? "All caught up — no orders waiting to be packed."
              : "No orders marked as Ready yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <FulfillmentCard
              key={order.id}
              order={order}
              onOpen={() => setOpenOrderId(order.id)}
              onMarkReady={() => markReady.mutate(order.id)}
              isMarking={markReady.isPending && markReady.variables === order.id}
            />
          ))}
        </div>
      )}

      {openOrderId && (
        <OrderDetailModal
          orderId={openOrderId}
          open={!!openOrderId}
          onClose={() => setOpenOrderId(null)}
        />
      )}
    </div>
  );
};

interface CardProps {
  order: FulfillmentOrder;
  onOpen: () => void;
  onMarkReady: () => void;
  isMarking: boolean;
}

const FulfillmentCard = ({ order, onOpen, onMarkReady, isMarking }: CardProps) => {
  const location = useMemo(() => {
    const parts = [
      order.shipping_division?.name,
      order.shipping_thana?.name,
    ].filter(Boolean);
    return parts.join(" / ");
  }, [order]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const getImage = (item: FulfillmentItem) => {
    const imgs = item.product?.images;
    if (!imgs || imgs.length === 0) return null;
    const sorted = [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return sorted[0]?.image_url ?? null;
  };

  const variantText = (item: FulfillmentItem) => {
    const d = item.variant_details || {};
    const parts: string[] = [];
    const size = (d as Record<string, unknown>).size;
    const color = (d as Record<string, unknown>).color;
    if (size) parts.push(String(size));
    if (color) parts.push(String(color));
    if (parts.length === 0 && item.variant_sku) parts.push(item.variant_sku);
    return parts.join(" · ");
  };

  return (
    <div
      className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Thumbnails */}
        <div className="flex gap-3 flex-wrap min-w-0 flex-1">
          {order.items.map((item) => {
            const img = getImage(item);
            return (
              <div key={item.id} className="flex flex-col items-center w-28 shrink-0">
                <div className="w-28 h-28 rounded-xl bg-muted overflow-hidden border">
                  {img ? (
                    <img
                      src={img}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                      No img
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold mt-1.5 text-center leading-tight">
                  ×{item.quantity}
                </div>
                <div className="text-[11px] text-muted-foreground text-center leading-tight truncate w-full">
                  {variantText(item) || "—"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0 space-y-1.5 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base">{order.order_number}</span>
            <Badge variant="outline" className="capitalize">
              {order.order_status}
            </Badge>
            {order.payment_method_type && (
              <Badge variant="secondary" className="uppercase text-[10px]">
                {order.payment_method_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {order.consignment_id ? (
              <span className="text-base font-bold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Parcel ID: {order.consignment_id}
              </span>
            ) : (
              <span className="text-base font-bold text-foreground flex items-center gap-1">
                <Copy className="w-4 h-4 text-muted-foreground" />
                Parcel ID: —
              </span>
            )}
          </div>
          <div className="font-medium">{order.shipping_name}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyText(order.shipping_phone, "Phone");
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Phone className="w-3 h-3" />
            {order.shipping_phone}
          </button>
          {location && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {location}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {format(new Date(order.created_at), "dd MMM yyyy · HH:mm")} ·{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Action */}
        <div className="flex lg:flex-col items-end justify-end gap-2 shrink-0">
          {order.order_status === "processing" ? (
            <Button
              disabled
              variant="outline"
              className="w-full lg:w-auto gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Ready
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onMarkReady();
              }}
              disabled={isMarking}
              className="w-full lg:w-auto gap-2"
            >
              {isMarking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PackageCheck className="w-4 h-4" />
              )}
              Mark as Ready
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderFulfillment;
