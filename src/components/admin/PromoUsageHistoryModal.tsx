import { useState } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { usePromoUsages, useDeletePromoUsage, PromoUsage, Customer } from "@/hooks/useCustomers";
import PromoUsageModal from "./PromoUsageModal";

interface PromoUsageHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

const PromoUsageHistoryModal = ({ open, onOpenChange, customer }: PromoUsageHistoryModalProps) => {
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoUsage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: promoUsages, isLoading } = usePromoUsages(customer.id);
  const deletePromoUsage = useDeletePromoUsage();

  // Fetch order-based promo code usages (read-only, from promo_code_usages table)
  const { data: orderPromoUsages, isLoading: orderPromoLoading } = useQuery({
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

  const handleEdit = (promo: PromoUsage) => {
    setSelectedPromo(promo);
    setPromoModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deletePromoUsage.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promo Usage History - {customer.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="order" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="order" className="flex-1">
                Order Promos ({orderPromoUsages?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Manual Promos ({promoUsages?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Order-based promo usages (read-only) */}
            <TabsContent value="order" className="mt-4">
              {orderPromoLoading ? (
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
            </TabsContent>

            {/* Manual promo usages (editable) */}
            <TabsContent value="manual" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Total usages: <Badge variant="secondary">{promoUsages?.length || 0}</Badge>
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedPromo(null);
                    setPromoModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Usage
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : promoUsages && promoUsages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Promo Code</TableHead>
                      <TableHead>Benefit Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date Used</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promoUsages.map((promo) => (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <Badge variant="outline">{promo.promo_code}</Badge>
                        </TableCell>
                        <TableCell>{promo.benefit_type || "-"}</TableCell>
                        <TableCell>
                          {promo.benefit_amount ? `৳${promo.benefit_amount.toLocaleString("en-BD")}` : "-"}
                        </TableCell>
                        <TableCell>{format(new Date(promo.used_at), "PPp")}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{promo.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(promo)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteId(promo.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No manual promo usage history found for this customer.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <PromoUsageModal
        open={promoModalOpen}
        onOpenChange={setPromoModalOpen}
        customerId={customer.id}
        promoUsage={selectedPromo}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Usage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this promo usage record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PromoUsageHistoryModal;