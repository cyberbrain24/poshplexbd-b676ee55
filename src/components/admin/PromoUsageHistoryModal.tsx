import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { Customer } from "@/hooks/useCustomers";

interface PromoUsageHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const PromoUsageHistoryModal = ({ open, onOpenChange, customer }: PromoUsageHistoryModalProps) => {
  const { data: orderPromoUsages, isLoading } = useQuery({
    queryKey: ["order-promo-usages", customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_code_usages")
        .select(`
          id, discount_amount, used_at,
          promo_code:promo_codes(id, code, discount_type, discount_value),
          order:orders(id, order_number, total_amount)
        `)
        .eq("customer_id", customer.id)
        .order("used_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Promo Usage History - {customer.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : orderPromoUsages && orderPromoUsages.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promo Code</TableHead>
                <TableHead>Discount Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderPromoUsages.map((usage: any) => (
                <TableRow key={usage.id}>
                  <TableCell>
                    <Badge variant="outline">{usage.promo_code?.code || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="capitalize">
                    {usage.promo_code?.discount_type || "-"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(usage.discount_amount)}
                  </TableCell>
                  <TableCell>
                    {usage.order?.order_number || "-"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(usage.used_at), "PPp")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No promo codes used in orders yet.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromoUsageHistoryModal;
