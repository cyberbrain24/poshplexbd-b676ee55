import { useState } from "react";
import { useLowStockItems, useAdjustStock } from "@/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Plus, ArrowUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StockHistoryModal from "./StockHistoryModal";

const LowStockAlerts = () => {
  const [threshold, setThreshold] = useState(5);
  const { data: lowStockItems, isLoading } = useLowStockItems(threshold);
  const adjustStock = useAdjustStock();
  
  const [restockModal, setRestockModal] = useState<{
    open: boolean;
    variantId: string | null;
    currentStock: number;
    productName: string;
    sku: string;
  }>({ open: false, variantId: null, currentStock: 0, productName: '', sku: '' });
  
  const [newStock, setNewStock] = useState(0);
  const [restockReason, setRestockReason] = useState("Supplier delivery");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const openRestockModal = (item: any) => {
    setRestockModal({
      open: true,
      variantId: item.id,
      currentStock: item.stock,
      productName: item.product?.name || '',
      sku: item.sku,
    });
    setNewStock(item.stock + 10); // Default to adding 10 units
    setRestockReason("Supplier delivery");
  };

  const handleRestock = async () => {
    if (!restockModal.variantId) return;
    
    try {
      await adjustStock.mutateAsync({
        variantId: restockModal.variantId,
        newStock,
        reason: restockReason,
      });
      setRestockModal({ open: false, variantId: null, currentStock: 0, productName: '', sku: '' });
    } catch (error) {
      console.error(error);
    }
  };

  const outOfStockCount = lowStockItems?.filter(i => i.stock === 0).length || 0;
  const lowStockCount = lowStockItems?.filter(i => i.stock > 0).length || 0;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-destructive">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock (≤{threshold})</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockCount}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="threshold" className="text-sm">Alert Threshold:</Label>
              <Input
                id="threshold"
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 5)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">units</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Items Requiring Attention
          </CardTitle>
          <CardDescription>
            Products with stock at or below {threshold} units. Out-of-stock items are automatically hidden from the storefront.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      🎉 All items are well-stocked!
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems?.map((item) => (
                    <TableRow key={item.id} className={item.stock === 0 ? "bg-red-50" : ""}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="font-medium">{item.product?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.color && (
                            <span className="text-sm">{item.color.name}</span>
                          )}
                          {item.size && (
                            <Badge variant="outline" className="text-xs">
                              {item.size.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={item.stock === 0 ? "text-destructive font-bold" : "text-orange-600 font-medium"}>
                          {item.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.stock === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            Low Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVariantId(item.id)}
                          >
                            History
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openRestockModal(item)}
                          >
                            <ArrowUp className="h-4 w-4 mr-1" />
                            Restock
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Restock Modal */}
      <Dialog open={restockModal.open} onOpenChange={(open) => !open && setRestockModal({ open: false, variantId: null, currentStock: 0, productName: '', sku: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Product</p>
                <p className="font-medium">{restockModal.productName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SKU</p>
                <p className="font-mono">{restockModal.sku}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Current Stock: {restockModal.currentStock}</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="newStock">New Stock Level:</Label>
                <Input
                  id="newStock"
                  type="number"
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">
                  (+{newStock - restockModal.currentStock} units)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={restockReason}
                onChange={(e) => setRestockReason(e.target.value)}
                placeholder="e.g., Supplier delivery, Inventory count..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockModal({ open: false, variantId: null, currentStock: 0, productName: '', sku: '' })}>
              Cancel
            </Button>
            <Button onClick={handleRestock} disabled={adjustStock.isPending}>
              {adjustStock.isPending ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StockHistoryModal
        variantId={selectedVariantId}
        open={!!selectedVariantId}
        onClose={() => setSelectedVariantId(null)}
      />
    </>
  );
};

export default LowStockAlerts;
