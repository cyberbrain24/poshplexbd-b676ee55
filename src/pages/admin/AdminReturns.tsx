import AdminLayout from "@/components/admin/AdminLayout";
import { useReturnRequests, useProcessReturnRequest, ReturnRequest } from "@/hooks/useReturns";
import { useProcessReturn } from "@/hooks/useInventory";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Package,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  received: "bg-purple-100 text-purple-800",
  restocked: "bg-green-100 text-green-800",
  damaged: "bg-orange-100 text-orange-800",
};

const AdminReturns = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [restockDecision, setRestockDecision] = useState<"restock" | "damaged">("restock");
  
  const { data: returns, isLoading, refetch } = useReturnRequests(
    statusFilter !== "all" ? statusFilter : undefined
  );
  const processReturn = useProcessReturnRequest();
  const processInventory = useProcessReturn();

  const handleApprove = async () => {
    if (!selectedReturn) return;
    await processReturn.mutateAsync({
      requestId: selectedReturn.id,
      status: 'approved',
      adminNotes: adminNote,
    });
    setSelectedReturn(null);
    setAdminNote("");
    refetch();
  };

  const handleReject = async () => {
    if (!selectedReturn) return;
    await processReturn.mutateAsync({
      requestId: selectedReturn.id,
      status: 'rejected',
      adminNotes: adminNote,
    });
    setSelectedReturn(null);
    setAdminNote("");
    refetch();
  };

  const handleReceived = async () => {
    if (!selectedReturn) return;
    await processReturn.mutateAsync({
      requestId: selectedReturn.id,
      status: 'received',
      adminNotes: adminNote,
    });
    setSelectedReturn(null);
    setAdminNote("");
    refetch();
  };

  const handleProcessInventory = async () => {
    if (!selectedReturn || !selectedReturn.order_item) return;
    
    // First update return status
    await processReturn.mutateAsync({
      requestId: selectedReturn.id,
      status: restockDecision === 'restock' ? 'restocked' : 'damaged',
      adminNotes: adminNote,
      restockDecision,
    });

    // Then process inventory
    const variantId = (selectedReturn.order_item as any).variant_id;
    if (variantId) {
      await processInventory.mutateAsync({
        variantId,
        quantity: selectedReturn.quantity,
        orderId: selectedReturn.order_id,
        orderItemId: selectedReturn.order_item_id,
        returnType: restockDecision === 'restock' ? 'good' : 'damaged',
      });
    }

    setSelectedReturn(null);
    setAdminNote("");
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
              <RotateCcw className="h-6 w-6" /> Return Requests
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage product return requests and inventory restocking
            </p>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="restocked">Restocked</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Returns Table */}
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
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
              ) : returns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-medium">No return requests</p>
                    <p className="text-muted-foreground">Return requests will appear here</p>
                  </TableCell>
                </TableRow>
              ) : (
                returns?.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell>
                      <span className="font-medium">{ret.order?.order_number}</span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{ret.order_item?.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        SKU: {ret.order_item?.variant_sku || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ret.customer?.name || 'Guest'}</span>
                    </TableCell>
                    <TableCell>
                      <span>{ret.quantity}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ret.reason}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ret.status]} variant="outline">
                        {ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(ret.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReturn(ret)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Process Return Modal */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Return Request</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order:</span>
                  <p className="font-medium">{selectedReturn.order?.order_number}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Product:</span>
                  <p className="font-medium">{selectedReturn.order_item?.product_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quantity:</span>
                  <p className="font-medium">{selectedReturn.quantity}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Value:</span>
                  <p className="font-medium">
                    ৳{((selectedReturn.order_item?.unit_price || 0) * selectedReturn.quantity).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Return Reason:</span>
                <p className="font-medium">{selectedReturn.reason}</p>
                {selectedReturn.description && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedReturn.description}</p>
                )}
              </div>

              {selectedReturn.proof_images && selectedReturn.proof_images.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Proof Images:</span>
                  <div className="flex gap-2 mt-2">
                    {selectedReturn.proof_images.map((img, i) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                        <img src={img} alt={`Proof ${i+1}`} className="w-20 h-20 object-cover rounded border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.status === 'received' && (
                <div>
                  <span className="text-sm text-muted-foreground">Restock Decision:</span>
                  <Select value={restockDecision} onValueChange={(v: any) => setRestockDecision(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restock">Restock (Good condition)</SelectItem>
                      <SelectItem value="damaged">Mark as Damaged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Textarea
                placeholder="Admin notes..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
              />

              <div className="bg-muted/50 p-3 rounded text-sm">
                <span className="font-medium">Current Status: </span>
                <Badge className={statusColors[selectedReturn.status]} variant="outline">
                  {selectedReturn.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            {selectedReturn?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={handleReject} disabled={processReturn.isPending}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button onClick={handleApprove} disabled={processReturn.isPending}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
              </>
            )}
            {selectedReturn?.status === 'approved' && (
              <Button onClick={handleReceived} disabled={processReturn.isPending}>
                <Package className="h-4 w-4 mr-1" /> Mark as Received
              </Button>
            )}
            {selectedReturn?.status === 'received' && (
              <Button 
                onClick={handleProcessInventory} 
                disabled={processReturn.isPending || processInventory.isPending}
                className={restockDecision === 'restock' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
              >
                {restockDecision === 'restock' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" /> Restock Item
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" /> Mark Damaged
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReturns;
