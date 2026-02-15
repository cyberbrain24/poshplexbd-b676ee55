import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useCustomerAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  type CustomerAddress,
  type AddressFormData,
} from "@/hooks/useCustomerAddresses";

interface Division { id: string; name: string }
interface Thana { id: string; name: string; division_id: string }

const emptyForm: AddressFormData = {
  label: "Home",
  address: "",
  division_id: null,
  thana_id: null,
  postal_code: null,
  is_default_shipping: false,
  is_default_billing: false,
};

export default function AddressManager({ customerId }: { customerId: string }) {
  const { data: addresses = [], isLoading } = useCustomerAddresses(customerId);
  const createAddress = useCreateAddress(customerId);
  const updateAddress = useUpdateAddress(customerId);
  const deleteAddress = useDeleteAddress(customerId);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormData>(emptyForm);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);

  useEffect(() => {
    supabase.from("divisions").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => setDivisions(data || []));
  }, []);

  useEffect(() => {
    if (form.division_id) {
      supabase.from("thanas").select("id, name, division_id")
        .eq("division_id", form.division_id).eq("is_active", true).order("name")
        .then(({ data }) => setThanas(data || []));
    } else {
      setThanas([]);
    }
  }, [form.division_id]);

  const openNew = () => {
    setForm({ ...emptyForm, is_default_shipping: addresses.length === 0 });
    setEditingId(null);
    setIsEditing(true);
  };

  const openEdit = (addr: CustomerAddress) => {
    setForm({
      label: addr.label,
      address: addr.address,
      division_id: addr.division_id,
      thana_id: addr.thana_id,
      postal_code: addr.postal_code,
      is_default_shipping: addr.is_default_shipping,
      is_default_billing: addr.is_default_billing,
    });
    setEditingId(addr.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!form.address.trim()) { toast.error("Address is required"); return; }
    if (!form.division_id) { toast.error("District is required"); return; }
    if (!form.thana_id) { toast.error("Thana is required"); return; }

    try {
      if (editingId) {
        await updateAddress.mutateAsync({ id: editingId, ...form });
        toast.success("Address updated");
      } else {
        await createAddress.mutateAsync(form);
        toast.success("Address added");
      }
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAddress.mutateAsync(id);
      toast.success("Address deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Label</Label>
                <Select value={form.label} onValueChange={v => setForm(f => ({ ...f, label: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home">Home</SelectItem>
                    <SelectItem value="Office">Office</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Postal Code</Label>
                <Input value={form.postal_code || ""} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="mt-1" placeholder="e.g. 1205" />
              </div>
            </div>
            <div>
              <Label className="text-sm">Address *</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="House, Road, Area" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">District *</Label>
                <Select value={form.division_id || ""} onValueChange={v => setForm(f => ({ ...f, division_id: v, thana_id: null }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>
                    {divisions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Thana/Upazila *</Label>
                <Select value={form.thana_id || ""} onValueChange={v => setForm(f => ({ ...f, thana_id: v }))} disabled={!form.division_id}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.division_id ? "Select thana" : "Select district first"} /></SelectTrigger>
                  <SelectContent>
                    {thanas.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_default_shipping} onCheckedChange={v => setForm(f => ({ ...f, is_default_shipping: !!v }))} />
                Default Shipping
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_default_billing} onCheckedChange={v => setForm(f => ({ ...f, is_default_billing: !!v }))} />
                Default Billing
              </label>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={createAddress.isPending || updateAddress.isPending}>
                {createAddress.isPending || updateAddress.isPending ? "Saving..." : "Save Address"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); setEditingId(null); }}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">No saved addresses yet.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="flex items-start justify-between border rounded-md p-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{addr.label}</span>
                    {addr.is_default_shipping && <Badge variant="secondary" className="text-xs">Shipping</Badge>}
                    {addr.is_default_billing && <Badge variant="outline" className="text-xs">Billing</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.address}</p>
                  <p className="text-xs text-muted-foreground">
                    {[addr.division?.name, addr.thana?.name, addr.postal_code].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(addr)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
