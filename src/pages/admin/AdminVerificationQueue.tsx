import { useState } from "react";
import { useVerificationQueue, useUpdatePaymentStatus, Order } from "@/hooks/useOrders";
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
  Clock, 
  CheckCircle, 
  XCircle, 
  Image as ImageIcon,
  AlertTriangle,
  Phone,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";

const AdminVerificationQueue = () => {
  const { data: orders, isLoading, refetch } = useVerificationQueue();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [note, setNote] = useState("");

  const handleApprove = async () => {
    if (!selectedOrder) return;
    await updatePaymentStatus.mutateAsync({
      orderId: selectedOrder.id,
      status: 'paid',
      notes: note || 'Payment verified and approved',
    });
    setSelectedOrder(null);
    setNote("");
    refetch();
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    await updatePaymentStatus.mutateAsync({
      orderId: selectedOrder.id,
      status: 'failed',
      notes: note || 'Payment verification failed',
    });
    setSelectedOrder(null);
    setNote("");
    refetch();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-medium tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6" /> Payment Verification Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and verify manual payment submissions
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-800">Pending Verification</p>
            <p className="text-sm text-yellow-700">
              These orders require payment proof verification before processing. 
              Check the transaction ID and proof image carefully before approving.
            </p>
          </div>
        </div>

        {/* Queue Table */}
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Transaction Details</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-muted-foreground">No pending verifications</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.items?.length || 0} items
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.shipping_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.shipping_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">
                        ৳{order.total_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <CreditCard className="h-3 w-3" />
                        {order.payment_method?.name || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {order.transaction_id && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">TxID: </span>
                            <span className="font-mono">{order.transaction_id}</span>
                          </div>
                        )}
                        {order.sender_number && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">From: </span>
                            <span>{order.sender_number}</span>
                          </div>
                        )}
                        {order.payment_proof_url && (
                          <a 
                            href={order.payment_proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                          >
                            <ImageIcon className="h-3 w-3" /> View Proof
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, h:mm a')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify Payment - {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{selectedOrder.shipping_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Amount:</span>
                  <p className="font-medium text-lg">৳{selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <p className="font-medium">{selectedOrder.payment_method?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <p className="font-mono">{selectedOrder.transaction_id || 'N/A'}</p>
                </div>
              </div>

              {selectedOrder.sender_number && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Sender Number:</span>
                  <p className="font-medium">{selectedOrder.sender_number}</p>
                </div>
              )}

              {selectedOrder.payment_proof_url && (
                <div className="border rounded p-2">
                  <img 
                    src={selectedOrder.payment_proof_url} 
                    alt="Payment proof" 
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}

              <Textarea
                placeholder="Add a note (optional)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={updatePaymentStatus.isPending}
            >
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={updatePaymentStatus.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVerificationQueue;
