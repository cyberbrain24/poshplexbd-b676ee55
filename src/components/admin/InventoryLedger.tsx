import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Search, ArrowDown, ArrowUp, RefreshCw, FileX, Package, Edit, History } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type InventoryTransactionType = Database["public"]["Enums"]["inventory_transaction_type"];

const InventoryLedger = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["inventory-ledger", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("inventory_transactions")
        .select(`
          *,
          variant:product_variants(
            sku,
            product:products(name),
            color:colors(name),
            size:sizes(label)
          ),
          order:orders(order_number)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (typeFilter !== "all") {
        query = query.eq("transaction_type", typeFilter as InventoryTransactionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filteredTransactions = transactions?.filter(tx => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.variant?.sku?.toLowerCase().includes(searchLower) ||
      tx.variant?.product?.name?.toLowerCase().includes(searchLower) ||
      tx.order?.order_number?.toLowerCase().includes(searchLower) ||
      tx.notes?.toLowerCase().includes(searchLower)
    );
  });

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

  // Calculate summary stats
  const stats = {
    totalSales: transactions?.filter(t => t.transaction_type === 'sale' || t.transaction_type === 'deduct').reduce((sum, t) => sum + Math.abs(t.quantity), 0) || 0,
    totalReturns: transactions?.filter(t => t.transaction_type === 'return_good' || t.transaction_type === 'restock').reduce((sum, t) => sum + t.quantity, 0) || 0,
    totalAdjustments: transactions?.filter(t => t.transaction_type === 'adjustment').length || 0,
    totalWriteOffs: transactions?.filter(t => t.transaction_type === 'return_damaged' || t.transaction_type === 'write_off' as any).length || 0,
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Units Sold</p>
            <p className="text-2xl font-bold text-destructive">{stats.totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Units Returned</p>
            <p className="text-2xl font-bold text-primary">{stats.totalReturns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Adjustments</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalAdjustments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Write-offs</p>
            <p className="text-2xl font-bold text-orange-600">{stats.totalWriteOffs}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Complete Audit Ledger
          </CardTitle>
          <CardDescription>
            Immutable record of all stock movements. Every change is tracked with timestamps and context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, product, order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="return_good">Returns (Good)</SelectItem>
                <SelectItem value="return_damaged">Returns (Damaged)</SelectItem>
                <SelectItem value="cancellation">Cancellations</SelectItem>
                <SelectItem value="restock">Restocks</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
                <SelectItem value="deduct">Deductions</SelectItem>
                <SelectItem value="reserve">Reserves</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Stock After</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="max-w-48">Notes</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions?.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{getTransactionIcon(tx.transaction_type)}</TableCell>
                        <TableCell>{getTransactionBadge(tx.transaction_type)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {tx.variant?.sku || "—"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{tx.variant?.product?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {[tx.variant?.color?.name, tx.variant?.size?.label].filter(Boolean).join(" / ")}
                            </p>
                          </div>
                        </TableCell>
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
                        <TableCell className="max-w-48">
                          <p className="text-sm text-muted-foreground truncate" title={tx.notes || ""}>
                            {tx.notes || "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(tx.created_at), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>

          <p className="text-xs text-muted-foreground">
            Showing last 200 transactions. All entries are immutable and provide a complete audit trail.
          </p>
        </CardContent>
      </Card>
    </>
  );
};

export default InventoryLedger;
