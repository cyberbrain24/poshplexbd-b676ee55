import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { PackageCheck, Search, Copy, Phone, MapPin, Loader2, Inbox, CheckCircle2, RefreshCw, X, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useSyncSteadfastStatus } from "@/hooks/useSteadfast";
import OrderDetailModal from "@/components/admin/OrderDetailModal";

const READY_STORAGE_KEY = "fulfillment_ready_orders_v1";

const loadReadySet = (): Set<string> => {
  try {
    const raw = localStorage.getItem(READY_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
};

const saveReadySet = (set: Set<string>) => {
  try {
    localStorage.setItem(READY_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
};

type StatusFilter = "all" | "not_ready" | "ready";

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["fulfillment-orders", statusFilter, search],
    queryFn: async () => {
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
        .eq("order_status", "confirmed")
        .order("created_at", { ascending: true });

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

  const [readySet, setReadySet] = useState<Set<string>>(() => loadReadySet());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === READY_STORAGE_KEY) setReadySet(loadReadySet());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleReady = useCallback((orderId: string) => {
    setReadySet((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
        toast.success("Moved back to Not Ready");
      } else {
        next.add(orderId);
        toast.success("Marked as Ready");
      }
      saveReadySet(next);
      return next;
    });
  }, []);

  const allOrders = data?.orders ?? [];
  const orders = useMemo(() => {
    if (statusFilter === "ready") return allOrders.filter((o) => readySet.has(o.id));
    if (statusFilter === "not_ready") return allOrders.filter((o) => !readySet.has(o.id));
    return allOrders;
  }, [allOrders, statusFilter, readySet]);

  const syncAllSteadfast = useSyncSteadfastStatus();

  const handleSyncAllSteadfast = async () => {
    try {
      const { data: syncData, error } = await supabase
        .from("orders")
        .select("id, tracking_number, consignment_id")
        .or("tracking_number.not.is.null,consignment_id.not.is.null");
      if (error) throw error;
      const ids = (syncData || [])
        .filter((o: any) => o.tracking_number || o.consignment_id)
        .map((o: any) => o.id);
      if (ids.length === 0) {
        toast.message("No shipped orders in database to sync");
        return;
      }
      syncAllSteadfast.mutate(ids, {
        onSettled: () => {
          qc.invalidateQueries({ queryKey: ["fulfillment-orders"] });
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders for sync");
    }
  };

  const filterConfig: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All In Review Order" },
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
          <Button
            onClick={handleSyncAllSteadfast}
            disabled={syncAllSteadfast.isPending || isLoading}
            variant="outline"
            size="sm"
          >
            {syncAllSteadfast.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync Steadfast
          </Button>
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
          <p className="font-medium">No orders in review.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <FulfillmentCard
              key={order.id}
              order={order}
              isReady={readySet.has(order.id)}
              onOpen={() => setOpenOrderId(order.id)}
              onToggleReady={() => toggleReady(order.id)}
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
  onToggleReady: () => void;
  isReady: boolean;
}

const FulfillmentCard = ({ order, onOpen, onToggleReady, isReady }: CardProps) => {
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

  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

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
          <div key={item.id} className="flex flex-col items-center w-56 sm:w-28 shrink-0">
                <div className="w-56 h-56 sm:w-28 sm:h-28 rounded-xl bg-muted overflow-hidden border">
                  {img ? (
                    <img
                      src={img}
                      alt={item.product_name}
                      className="w-full h-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightbox({ src: img, alt: item.product_name });
                      }}
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
                <div className="text-sm font-bold text-foreground text-center leading-tight truncate w-full">
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
              <span className="text-lg font-bold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Parcel ID: {order.consignment_id}
              </span>
            ) : (
              <span className="text-lg font-bold text-foreground flex items-center gap-1">
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
          {isReady ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleReady();
              }}
              className="w-full lg:w-auto gap-2 text-white hover:opacity-90"
              style={{ backgroundColor: '#16a34a' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Ready
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onToggleReady();
              }}
              className="w-full lg:w-auto gap-2 bg-black text-white hover:bg-black/90"
            >
              <PackageCheck className="w-4 h-4" />
              Mark as Ready
            </Button>
          )}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox(null);
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox.src}
            alt={lightbox.alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminOrderFulfillment;
