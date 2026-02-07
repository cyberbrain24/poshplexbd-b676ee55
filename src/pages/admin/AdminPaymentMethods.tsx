import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, CreditCard, Banknote, Smartphone, Building2, Globe } from "lucide-react";
import { usePaymentMethodsAdmin, useDeletePaymentMethod, useTogglePaymentMethodStatus, PaymentMethod } from "@/hooks/usePaymentMethods";
import { PaymentMethodModal } from "@/components/admin/PaymentMethodModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  cod: <Banknote className="h-4 w-4" />,
  mobile_banking: <Smartphone className="h-4 w-4" />,
  bank_transfer: <Building2 className="h-4 w-4" />,
  card: <CreditCard className="h-4 w-4" />,
  online_gateway: <Globe className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  mobile_banking: "Mobile Banking",
  bank_transfer: "Bank Transfer",
  card: "Card Payment",
  online_gateway: "Online Gateway",
};

export default function AdminPaymentMethods() {
  const { data: paymentMethods, isLoading } = usePaymentMethodsAdmin();
  const deleteMutation = useDeletePaymentMethod();
  const toggleStatusMutation = useTogglePaymentMethodStatus();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

  const handleEdit = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMethod(null);
    setModalOpen(true);
  };

  const handleDelete = (method: PaymentMethod) => {
    setMethodToDelete(method);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (methodToDelete) {
      await deleteMutation.mutateAsync(methodToDelete.id);
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    }
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    await toggleStatusMutation.mutateAsync({ id: method.id, is_active: !method.is_active });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">
            Manage payment options available during checkout
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !paymentMethods?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment methods configured. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {TYPE_ICONS[method.type]}
                        {method.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPE_LABELS[method.type] || method.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {method.account_details && Object.keys(method.account_details).length > 0 ? (
                        <div className="text-sm text-muted-foreground max-w-xs truncate">
                          {Object.entries(method.account_details)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(", ")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={method.is_active}
                        onCheckedChange={() => handleToggleStatus(method)}
                        disabled={toggleStatusMutation.isPending}
                      />
                    </TableCell>
                    <TableCell>{method.sort_order}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(method)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(method)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentMethodModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paymentMethod={selectedMethod}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{methodToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
