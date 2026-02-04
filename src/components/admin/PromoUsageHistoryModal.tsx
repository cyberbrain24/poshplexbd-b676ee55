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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
                      {promo.benefit_amount ? `৳${promo.benefit_amount.toLocaleString()}` : "-"}
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
              No promo usage history found for this customer.
            </div>
          )}
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
