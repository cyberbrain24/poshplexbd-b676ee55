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
import { useDivisions, useDeleteDivision, Division } from "@/hooks/useCustomers";
import DivisionModal from "@/components/admin/DivisionModal";

const AdminDivisions = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: divisions, isLoading } = useDivisions();
  const deleteDivision = useDeleteDivision();

  const handleEdit = (division: Division) => {
    setSelectedDivision(division);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDivision.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Divisions</h1>
            <p className="text-muted-foreground">Manage geographical divisions for customers</p>
          </div>
          <Button onClick={() => { setSelectedDivision(null); setModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Division
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Divisions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : divisions && divisions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divisions.map((division) => (
                    <TableRow key={division.id}>
                      <TableCell className="font-medium">{division.name}</TableCell>
                      <TableCell>
                        <Badge variant={division.is_active ? "default" : "secondary"}>
                          {division.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(division)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteId(division.id)}
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
                No divisions found. Add your first division to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DivisionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        division={selectedDivision}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Division</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this division? This will also delete all associated thanas. This action cannot be undone.
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

export default AdminDivisions;
