import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Tag, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const usePromoCodes = () => {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });
};

const AdminPromoCodes = () => {
  const queryClient = useQueryClient();
  const { data: promoCodes, isLoading } = usePromoCodes();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_discount_amount: "",
    min_order_amount: "",
    usage_limit: "",
    per_customer_limit: "1",
    is_active: true,
    starts_at: "",
    expires_at: "",
  });

  const resetForm = () => {
    setForm({
      code: "", description: "", discount_type: "percentage",
      discount_value: "", max_discount_amount: "", min_order_amount: "",
      usage_limit: "", per_customer_limit: "1", is_active: true,
      starts_at: "", expires_at: "",
    });
    setEditingPromo(null);
  };

  const openCreate = () => { resetForm(); setModalOpen(true); };
  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setForm({
      code: promo.code,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      max_discount_amount: promo.max_discount_amount ? String(promo.max_discount_amount) : "",
      min_order_amount: promo.min_order_amount ? String(promo.min_order_amount) : "",
      usage_limit: promo.usage_limit ? String(promo.usage_limit) : "",
      per_customer_limit: String(promo.per_customer_limit),
      is_active: promo.is_active,
      starts_at: promo.starts_at ? promo.starts_at.slice(0, 16) : "",
      expires_at: promo.expires_at ? promo.expires_at.slice(0, 16) : "",
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : null,
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
        usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        per_customer_limit: Number(form.per_customer_limit) || 1,
        is_active: form.is_active,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };

      if (editingPromo) {
        const { error } = await supabase.from("promo_codes").update(payload).eq("id", editingPromo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success(editingPromo ? "Promo code updated" : "Promo code created");
      setModalOpen(false);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Promo code deleted");
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = promoCodes?.filter(p =>
    !search || p.code.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: promoCodes?.length || 0,
    active: promoCodes?.filter(p => p.is_active).length || 0,
    totalUsage: promoCodes?.reduce((s, p) => s + p.usage_count, 0) || 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Promo Codes</h1>
          <p className="text-muted-foreground">Manage discount and promo codes</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Promo Code
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Tag className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.active}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usages</CardTitle>
            <Tag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalUsage}</div></CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search promo codes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-bold">{promo.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {promo.discount_type === "percentage" ? <Percent className="h-3 w-3 mr-1" /> : <DollarSign className="h-3 w-3 mr-1" />}
                        {promo.discount_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.discount_type === "percentage" ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)}
                      {promo.max_discount_amount && <span className="text-xs text-muted-foreground block">Max: {formatCurrency(promo.max_discount_amount)}</span>}
                    </TableCell>
                    <TableCell>{promo.min_order_amount ? formatCurrency(promo.min_order_amount) : "—"}</TableCell>
                    <TableCell>
                      {promo.usage_count}{promo.usage_limit ? `/${promo.usage_limit}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge className={promo.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {promo.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {promo.expires_at ? format(new Date(promo.expires_at), "MMM d, yyyy") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(promo)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(promo.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No promo codes found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={() => { setModalOpen(false); resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPromo ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Code *</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SUMMER20" className="mt-1 font-mono" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Summer sale 20% off" className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type *</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v as any }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value *</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === "percentage" ? "20" : "200"} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Discount Amount</Label>
                <Input type="number" value={form.max_discount_amount} onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))} placeholder="Optional" className="mt-1" />
              </div>
              <div>
                <Label>Min Order Amount</Label>
                <Input type="number" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} placeholder="0" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Usage Limit</Label>
                <Input type="number" value={form.usage_limit} onChange={e => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="Unlimited" className="mt-1" />
              </div>
              <div>
                <Label>Per Customer Limit</Label>
                <Input type="number" value={form.per_customer_limit} onChange={e => setForm(f => ({ ...f, per_customer_limit: e.target.value }))} placeholder="1" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starts At</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.code || !form.discount_value}>
              {saveMutation.isPending ? "Saving..." : editingPromo ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPromoCodes;
