import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search, Filter, Users, UserCheck, Gift, X, LogIn } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import {
  useCustomers,
  useDeleteCustomer,
  useDivisions,
  useCustomerTypes,
  Customer,
  CustomerFilters,
} from "@/hooks/useCustomers";
import CustomerModal from "@/components/admin/CustomerModal";
import PromoUsageHistoryModal from "@/components/admin/PromoUsageHistoryModal";

const AdminCustomers = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promoHistoryCustomer, setPromoHistoryCustomer] = useState<Customer | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [searchInput, setSearchInput] = useState("");

  const { data: customers, isLoading } = useCustomers(filters);
  const { data: divisions } = useDivisions();
  const { data: customerTypes } = useCustomerTypes();
  const deleteCustomer = useDeleteCustomer();

  const handleLoginAsCustomer = async (customer: Customer) => {
    setImpersonating(customer.id);
    try {
      const { data, error } = await supabase.functions.invoke("impersonate-customer", {
        body: { customerId: customer.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.loginUrl) {
        window.open(data.loginUrl, "_blank");
        toast.success(`Opened login session for ${customer.name}`);
      }
    } catch (error: any) {
      console.error("Impersonation error:", error);
      toast.error(error.message || "Failed to login as customer");
    } finally {
      setImpersonating(null);
    }
  };

  // Apply search with debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCustomer.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof CustomerFilters] !== undefined && 
    filters[key as keyof CustomerFilters] !== ""
  );

  // Calculate stats
  const stats = useMemo(() => {
    if (!customers) return { total: 0, male: 0, female: 0, withPromo: 0 };
    return {
      total: customers.length,
      male: customers.filter(c => c.gender === "male").length,
      female: customers.filter(c => c.gender === "female").length,
      withPromo: customers.filter(c => (c.promo_usage_count || 0) > 0).length,
    };
  }, [customers]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={() => { setSelectedCustomer(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Male</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.male}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Female</CardTitle>
            <UserCheck className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.female}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Promo Usage</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withPromo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, address..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-4 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              <Select
                value={filters.gender || "all"}
                onValueChange={(v) => setFilters(prev => ({ ...prev, gender: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.customer_type_id || "all"}
                onValueChange={(v) => setFilters(prev => ({ ...prev, customer_type_id: v === "all" ? undefined : v }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Customer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {customerTypes?.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.division_id || "all"}
                onValueChange={(v) => setFilters(prev => ({ ...prev, division_id: v === "all" ? undefined : v, thana_id: undefined }))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Division" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Divisions</SelectItem>
                  {divisions?.map(div => (
                    <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.min_promo_usage?.toString() || "all"}
                onValueChange={(v) => setFilters(prev => ({ ...prev, min_promo_usage: v === "all" ? undefined : parseInt(v) }))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Promo Usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">1+ usages</SelectItem>
                  <SelectItem value="5">5+ usages</SelectItem>
                  <SelectItem value="10">10+ usages</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading customers...</div>
          ) : customers && customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Division / Thana</TableHead>
                  <TableHead>Customer Type</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Promo Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <Badge variant={
                        customer.gender === "male" ? "default" :
                        customer.gender === "female" ? "secondary" : "outline"
                      }>
                        {customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {customer.division?.name || "-"}
                      {customer.thana && ` / ${customer.thana.name}`}
                    </TableCell>
                    <TableCell>
                      {customer.customer_type?.name || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(customer as any).order_count ?? 0}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency((customer as any).total_spent ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPromoHistoryCustomer(customer)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        {customer.promo_usage_count || 0}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => customer.has_account && handleLoginAsCustomer(customer)}
                          disabled={impersonating === customer.id || !customer.has_account}
                          title={customer.has_account ? "Login as customer" : "No account linked"}
                          className={!customer.has_account ? "opacity-40 cursor-not-allowed" : ""}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(customer)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteId(customer.id)}
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
              No customers found. Add your first customer to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={selectedCustomer}
      />

      {promoHistoryCustomer && (
        <PromoUsageHistoryModal
          open={!!promoHistoryCustomer}
          onOpenChange={(open) => !open && setPromoHistoryCustomer(null)}
          customer={promoHistoryCustomer}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This will also delete all their promo usage history. This action cannot be undone.
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

export default AdminCustomers;
