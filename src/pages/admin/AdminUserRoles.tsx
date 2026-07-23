import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, KeyRound, Pencil, Plus } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import type { ModuleKey } from "@/hooks/usePermissions";

const MODULE_GROUPS: { label: string; items: { key: ModuleKey; label: string }[] }[] = [
  { label: "Overview", items: [{ key: "dashboard", label: "Business Intelligence (always on)" }] },
  { label: "Products", items: [
    { key: "products", label: "Products" },
    { key: "categories", label: "Categories" },
    { key: "colors", label: "Colors" },
    { key: "sizes", label: "Sizes" },
    { key: "size-guides", label: "Size Guides" },
  ]},
  { label: "Orders", items: [
    { key: "orders", label: "All Orders" },
    { key: "add-order", label: "Add Order" },
    { key: "order-fulfillment", label: "Order Fulfillment" },
    { key: "payment-methods", label: "Payment Methods" },
  ]},
  { label: "Customers", items: [
    { key: "customers", label: "Customers" },
    { key: "reviews", label: "Reviews" },
    { key: "divisions", label: "Districts" },
    { key: "thanas", label: "Thanas" },
    { key: "customer-types", label: "Membership Types" },
  ]},
  { label: "Integrations & Settings", items: [
    { key: "marketing", label: "Integration & Tracking (Meta / Steadfast)" },
    { key: "site-settings", label: "Site Settings" },
  ]},
];

interface AdminUser {
  id: string;
  user_id: string;
  username: string;
  modules: string[];
  is_active: boolean;
  created_at: string;
}

const emptyForm = { username: "", password: "", modules: [] as ModuleKey[] };

const AdminUserRoles = () => {
  const perms = usePermissions();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [pwUser, setPwUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-permissions-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminUser[];
    },
    enabled: perms.isSuperAdmin,
  });

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-admin-user", { body });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data;
  };

  const createMut = useMutation({
    mutationFn: () => invoke({ action: "create", ...form }),
    onSuccess: () => {
      toast.success("Admin user created");
      setCreateOpen(false); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["admin-permissions-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { user_id: string; modules?: string[]; is_active?: boolean }) =>
      invoke({ action: "update_modules", ...payload }),
    onSuccess: () => {
      toast.success("Updated");
      setEditUser(null);
      qc.invalidateQueries({ queryKey: ["admin-permissions-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwMut = useMutation({
    mutationFn: (payload: { user_id: string; password: string }) =>
      invoke({ action: "update_password", ...payload }),
    onSuccess: () => { toast.success("Password updated"); setPwUser(null); setNewPassword(""); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (user_id: string) => invoke({ action: "delete", user_id }),
    onSuccess: () => {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-permissions-list"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!perms.isSuperAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Only the super-admin can manage admin users.</div>;
  }

  const toggleModule = (key: ModuleKey, set: ModuleKey[], setter: (m: ModuleKey[]) => void) => {
    setter(set.includes(key) ? set.filter((k) => k !== key) : [...set, key]);
  };

  const renderModuleGrid = (selected: ModuleKey[], onChange: (m: ModuleKey[]) => void) => (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
      {MODULE_GROUPS.map((g) => (
        <div key={g.label}>
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">{g.label}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {g.items.map((it) => {
              const isDashboard = it.key === "dashboard";
              return (
                <label key={it.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={isDashboard || selected.includes(it.key)}
                    disabled={isDashboard}
                    onCheckedChange={() => !isDashboard && toggleModule(it.key, selected, onChange)}
                  />
                  <span>{it.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-medium tracking-tight">User Roles</h1>
          <p className="text-sm text-muted-foreground">Create sub-admin users and control the admin modules they can access.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add User</Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">Loading…</TableCell></TableRow>}
            {!isLoading && users.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No sub-admin users yet.</TableCell></TableRow>}
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.modules.length} module(s)</TableCell>
                <TableCell>
                  <Badge variant={u.is_active ? "default" : "secondary"}>{u.is_active ? "Active" : "Disabled"}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setPwUser(u)}><KeyRound className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm(`Delete ${u.username}? This removes their login.`)) deleteMut.mutate(u.user_id);
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Admin User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/\s/g, "").toLowerCase() })} placeholder="e.g. rakib" />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Allowed Modules</Label>
              {renderModuleGrid(form.modules, (m) => setForm({ ...form, modules: m }))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button disabled={!form.username || form.password.length < 6 || createMut.isPending} onClick={() => createMut.mutate()}>
              {createMut.isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modules */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Permissions — {editUser?.username}</DialogTitle></DialogHeader>
          {editUser && (
            <>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={editUser.is_active}
                  onCheckedChange={(v) => setEditUser({ ...editUser, is_active: !!v })}
                />
                Active
              </label>
              {renderModuleGrid(editUser.modules as ModuleKey[], (m) => setEditUser({ ...editUser, modules: m }))}
            </>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              disabled={updateMut.isPending}
              onClick={() => editUser && updateMut.mutate({ user_id: editUser.user_id, modules: editUser.modules, is_active: editUser.is_active })}
            >
              {updateMut.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password */}
      <Dialog open={!!pwUser} onOpenChange={(v) => { if (!v) { setPwUser(null); setNewPassword(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset Password — {pwUser?.username}</DialogTitle></DialogHeader>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setPwUser(null); setNewPassword(""); }}>Cancel</Button>
            <Button
              disabled={newPassword.length < 6 || pwMut.isPending}
              onClick={() => pwUser && pwMut.mutate({ user_id: pwUser.user_id, password: newPassword })}
            >
              {pwMut.isPending ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserRoles;
