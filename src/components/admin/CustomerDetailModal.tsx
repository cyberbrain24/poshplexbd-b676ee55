import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { Customer } from "@/hooks/useCustomers";
import { format } from "date-fns";
import { Mail, Phone, MapPin, User, Calendar, ShoppingBag, Wallet, Gift, BadgeCheck, Hash } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2 border-b last:border-0">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium break-words">{value || "-"}</div>
    </div>
  </div>
);

const CustomerDetailModal = ({ open, onOpenChange, customer }: Props) => {
  if (!customer) return null;
  const fmtDate = (d: string | null) => (d ? format(new Date(d), "PPP") : "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xl font-semibold">
            {customer.profile_image_url ? (
              <img src={customer.profile_image_url} alt={customer.name} className="h-full w-full object-cover" />
            ) : (
              customer.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold">{customer.name}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge variant={customer.gender === "male" ? "default" : customer.gender === "female" ? "secondary" : "outline"}>
                {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
              </Badge>
              {customer.customer_type?.name && <Badge variant="outline">{customer.customer_type.name}</Badge>}
              {customer.has_account && <Badge variant="default" className="bg-green-600">Has Account</Badge>}
              {!customer.is_active && <Badge variant="destructive">Inactive</Badge>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-4">
          <Card><CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShoppingBag className="h-3.5 w-3.5" />Orders</div>
            <div className="text-xl font-bold mt-1">{customer.order_count ?? 0}</div>
          </CardContent></Card>
          <Card><CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Total Spent</div>
            <div className="text-xl font-bold mt-1">{formatCurrency(customer.total_spent ?? 0)}</div>
          </CardContent></Card>


        </div>

        <div className="space-y-1">
          <Row icon={Phone} label="Phone" value={customer.phone} />
          <Row icon={Mail} label="Email" value={customer.email} />
          <Row icon={MapPin} label="Address" value={
            <div>
              {customer.address || ""}
              {(customer.division?.name || customer.thana?.name) && (
                <div className="text-xs text-muted-foreground">
                  {customer.thana?.name}{customer.thana?.name && customer.division?.name ? ", " : ""}{customer.division?.name}
                  {customer.postal_code ? ` - ${customer.postal_code}` : ""}
                </div>
              )}
            </div>
          } />
          <Row icon={Calendar} label="Birthdate" value={fmtDate(customer.birthdate)} />
          <Row icon={BadgeCheck} label="Member Since" value={fmtDate(customer.membership_assigned_at)} />
          <Row icon={User} label="Public Profile" value={customer.public_profile_visible ? "Visible" : "Hidden"} />
          <Row icon={Hash} label="Customer ID" value={<span className="font-mono text-xs">{customer.id}</span>} />
          <Row icon={Calendar} label="Created" value={fmtDate(customer.created_at)} />
          {customer.notes && <Row icon={User} label="Notes" value={customer.notes} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailModal;
