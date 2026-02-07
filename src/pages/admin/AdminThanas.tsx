import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useThanas, useDeleteThana, useDivisions, Thana } from "@/hooks/useCustomers";
import ThanaModal from "@/components/admin/ThanaModal";

const AdminThanas = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedThana, setSelectedThana] = useState<Thana | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [divisionFilter, setDivisionFilter] = useState<string | undefined>();

  const { data: thanas, isLoading } = useThanas(divisionFilter);
  const { data: divisions } = useDivisions();
  const deleteThana = useDeleteThana();

  const handleEdit = (thana: Thana) => {
    setSelectedThana(thana);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteThana.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Thanas</h1>
          <p className="text-muted-foreground">Manage thanas/sub-districts for customer addresses</p>
        </div>
        <Button onClick={() => { setSelectedThana(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Thana
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Thanas</CardTitle>
          <Select
            value={divisionFilter || "all"}
            onValueChange={(v) => setDivisionFilter(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by division" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {divisions?.map(div => (
                <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : thanas && thanas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thanas.map((thana) => (
                  <TableRow key={thana.id}>
                    <TableCell className="font-medium">{thana.name}</TableCell>
                    <TableCell>{thana.division?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={thana.is_active ? "default" : "secondary"}>
                        {thana.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(thana)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteId(thana.id)}
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
              No thanas found. Add your first thana to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <ThanaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        thana={selectedThana}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Thana</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this thana? This action cannot be undone.
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
    </div>
  );
};

export default AdminThanas;
