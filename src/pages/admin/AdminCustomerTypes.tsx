import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCustomerTypes, useDeleteCustomerType, CustomerType } from "@/hooks/useCustomers";
import CustomerTypeModal from "@/components/admin/CustomerTypeModal";

const AdminCustomerTypes = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<CustomerType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: customerTypes, isLoading } = useCustomerTypes();
  const deleteCustomerType = useDeleteCustomerType();

  const handleEdit = (type: CustomerType) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCustomerType.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Customer Types</h1>
            <p className="text-muted-foreground">Manage membership types for customers</p>
          </div>
          <Button onClick={() => { setSelectedType(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer Type
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customer Types</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : customerTypes && customerTypes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {type.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? "default" : "secondary"}>
                          {type.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(type)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteId(type.id)}
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
                No customer types found. Add your first customer type to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CustomerTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customerType={selectedType}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer type? Customers with this type will have their type cleared. This action cannot be undone.
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
    </AdminLayout>
  );
};

export default AdminCustomerTypes;
