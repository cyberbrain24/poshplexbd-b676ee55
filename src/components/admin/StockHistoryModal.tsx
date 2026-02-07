import { useStockHistory } from "@/hooks/useInventory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, RefreshCw, FileX, Package, Edit } from "lucide-react";

interface StockHistoryModalProps {
  variantId: string | null;
  open: boolean;
  onClose: () => void;
}

const StockHistoryModal = ({ variantId, open, onClose }: StockHistoryModalProps) => {
  const { data: history, isLoading } = useStockHistory(variantId);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
      case 'deduct':
        return <ArrowDown className="h-4 w-4 text-destructive" />;
      case 'return':
      case 'return_good':
      case 'restock':
      case 'cancellation':
        return <ArrowUp className="h-4 w-4 text-primary" />;
      case 'adjustment':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'write_off':
      case 'return_damaged':
        return <FileX className="h-4 w-4 text-orange-500" />;
      case 'initial':
      case 'reserve':
        return <Package className="h-4 w-4 text-muted-foreground" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      sale: "destructive",
      deduct: "destructive",
      return: "default",
      return_good: "default",
      restock: "default",
      cancellation: "default",
      adjustment: "secondary",
      write_off: "outline",
      return_damaged: "outline",
      initial: "outline",
      reserve: "secondary",
    };
    
    const labels: Record<string, string> = {
      sale: "Sale",
      deduct: "Deduct",
      return: "Return",
      return_good: "Return (Good)",
      restock: "Restock",
      cancellation: "Cancellation",
      adjustment: "Adjustment",
      write_off: "Write-off",
      return_damaged: "Return (Damaged)",
      initial: "Initial",
      reserve: "Reserve",
    };

    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock History / Audit Ledger
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transaction history for this item
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty Change</TableHead>
                  <TableHead>Stock After</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history?.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{getTransactionIcon(tx.transaction_type)}</TableCell>
                    <TableCell>{getTransactionBadge(tx.transaction_type)}</TableCell>
                    <TableCell>
                      <span className={tx.quantity >= 0 ? "text-primary font-medium" : "text-destructive font-medium"}>
                        {tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{tx.available_stock_after}</TableCell>
                    <TableCell>
                      {tx.order?.order_number ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {tx.order.order_number}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                      {tx.notes || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(tx.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground pt-2 border-t">
          Showing last 100 transactions. This ledger provides a complete audit trail of all stock movements.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StockHistoryModal;
