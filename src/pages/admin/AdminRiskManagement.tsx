import AdminLayout from "@/components/admin/AdminLayout";
import { useHighRiskCustomers, useToggleCOD, useBlacklistCustomer } from "@/hooks/useRiskManagement";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Shield, 
  Ban,
  Search,
  CreditCard,
  TrendingDown
} from "lucide-react";

const AdminRiskManagement = () => {
  const { data: profiles, isLoading, refetch } = useHighRiskCustomers();
  const toggleCOD = useToggleCOD();
  const blacklistCustomer = useBlacklistCustomer();
  
  const [search, setSearch] = useState("");
  const [blacklistModal, setBlacklistModal] = useState<{
    customerId: string;
    customerName: string;
    action: 'blacklist' | 'unblacklist';
  } | null>(null);
  const [blacklistReason, setBlacklistReason] = useState("");

  const filteredProfiles = profiles?.filter(p => 
    p.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.customer?.phone?.includes(search)
  );

  const handleBlacklist = async () => {
    if (!blacklistModal) return;
    await blacklistCustomer.mutateAsync({
      customerId: blacklistModal.customerId,
      blacklisted: blacklistModal.action === 'blacklist',
      reason: blacklistReason,
    });
    setBlacklistModal(null);
    setBlacklistReason("");
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" /> Risk Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage high-risk customers and fraud prevention
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
            <p className="text-2xl font-medium text-red-700">
              {profiles?.filter(p => p.cancellation_rate > 30).length || 0}
            </p>
            <p className="text-sm text-red-600">High Cancellation Rate</p>
          </div>
          <div className="p-4 border border-border bg-orange-50">
            <TrendingDown className="h-5 w-5 text-orange-600 mb-2" />
            <p className="text-2xl font-medium text-orange-700">
              {profiles?.filter(p => p.return_rate > 30).length || 0}
            </p>
            <p className="text-sm text-orange-600">High Return Rate</p>
          </div>
          <div className="p-4 border border-border bg-gray-100">
            <Ban className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-2xl font-medium">
              {profiles?.filter(p => p.is_blacklisted).length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Blacklisted</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Risk Profiles Table */}
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Cancellation Rate</TableHead>
                <TableHead>Return Rate</TableHead>
                <TableHead>Active COD</TableHead>
                <TableHead>COD Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredProfiles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-medium">No high-risk customers</p>
                    <p className="text-muted-foreground">All customers are in good standing</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles?.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="font-medium">{profile.customer?.name}</div>
                      <div className="text-xs text-muted-foreground">{profile.customer?.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {profile.completed_orders}/{profile.total_orders} completed
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={profile.cancellation_rate > 30 ? 'bg-red-100 text-red-800' : ''}
                      >
                        {profile.cancellation_rate.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={profile.return_rate > 30 ? 'bg-orange-100 text-orange-800' : ''}
                      >
                        {profile.return_rate.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={profile.active_cod_orders >= 2 ? 'text-red-600 font-medium' : ''}>
                        {profile.active_cod_orders}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!profile.cod_disabled}
                          onCheckedChange={(checked) => {
                            toggleCOD.mutate({
                              customerId: profile.customer_id,
                              disabled: !checked,
                            });
                          }}
                          disabled={toggleCOD.isPending}
                        />
                        <CreditCard className={`h-4 w-4 ${profile.cod_disabled ? 'text-red-500' : 'text-green-500'}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.is_blacklisted ? (
                        <Badge variant="destructive">Blacklisted</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={profile.is_blacklisted ? "outline" : "destructive"}
                        onClick={() => setBlacklistModal({
                          customerId: profile.customer_id,
                          customerName: profile.customer?.name || 'Unknown',
                          action: profile.is_blacklisted ? 'unblacklist' : 'blacklist',
                        })}
                      >
                        {profile.is_blacklisted ? 'Remove Ban' : 'Blacklist'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Blacklist Modal */}
      <Dialog open={!!blacklistModal} onOpenChange={() => setBlacklistModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blacklistModal?.action === 'blacklist' ? 'Blacklist Customer' : 'Remove from Blacklist'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {blacklistModal?.action === 'blacklist' 
                ? `Are you sure you want to blacklist ${blacklistModal?.customerName}? They will be unable to place COD orders.`
                : `Remove ${blacklistModal?.customerName} from the blacklist?`
              }
            </p>
            
            {blacklistModal?.action === 'blacklist' && (
              <div>
                <label className="text-sm text-muted-foreground">Reason (optional)</label>
                <Input
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Enter reason for blacklisting..."
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBlacklistModal(null)}>
              Cancel
            </Button>
            <Button 
              variant={blacklistModal?.action === 'blacklist' ? 'destructive' : 'default'}
              onClick={handleBlacklist}
              disabled={blacklistCustomer.isPending}
            >
              {blacklistModal?.action === 'blacklist' ? 'Blacklist' : 'Remove Ban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminRiskManagement;
