import { useState } from "react";
import { useInventoryList, useAdjustStock, useBulkAdjustStock } from "@/hooks/useInventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Save, RotateCcw, Package } from "lucide-react";
import { toast } from "sonner";
import StockHistoryModal from "./StockHistoryModal";

interface PendingChange {
  variantId: string;
  originalStock: number;
  newStock: number;
}

const InventoryQuickEdit = () => {
  const { data: inventory, isLoading } = useInventoryList();
  const adjustStock = useAdjustStock();
  const bulkAdjust = useBulkAdjustStock();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [bulkReason, setBulkReason] = useState("Inventory count adjustment");

  const filteredInventory = inventory?.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.sku?.toLowerCase().includes(searchLower) ||
      item.product?.name?.toLowerCase().includes(searchLower) ||
      item.color?.name?.toLowerCase().includes(searchLower) ||
      item.size?.label?.toLowerCase().includes(searchLower)
    );
  });

  const handleStockChange = (variantId: string, originalStock: number, value: string) => {
    const newStock = parseInt(value) || 0;
    if (newStock === originalStock) {
      const { [variantId]: removed, ...rest } = pendingChanges;
      setPendingChanges(rest);
    } else {
      setPendingChanges(prev => ({
        ...prev,
        [variantId]: { variantId, originalStock, newStock }
      }));
    }
  };

  const handleSaveAll = async () => {
    const changes = Object.values(pendingChanges);
    if (changes.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      await bulkAdjust.mutateAsync({
        adjustments: changes.map(c => ({
          variantId: c.variantId,
          newStock: c.newStock,
          reason: bulkReason,
        }))
      });
      setPendingChanges({});
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    setPendingChanges({});
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (stock <= 5) {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="secondary">{stock} in stock</Badge>;
  };

  const changesCount = Object.keys(pendingChanges).length;

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
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quick Stock Editor
              </CardTitle>
              <CardDescription>
                Spreadsheet-style editing for fast stock updates. Changes are tracked in the audit ledger.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {changesCount > 0 && (
                <>
                  <Badge variant="outline">{changesCount} pending</Badge>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={handleSaveAll} disabled={bulkAdjust.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    Save All
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, product name, color, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {changesCount > 0 && (
              <Input
                placeholder="Reason for adjustment..."
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                className="sm:w-64"
              />
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Stock</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No items found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory?.map((item) => {
                    const pendingChange = pendingChanges[item.id];
                    const displayStock = pendingChange?.newStock ?? item.stock;
                    const hasChange = pendingChange !== undefined;

                    return (
                      <TableRow key={item.id} className={hasChange ? "bg-yellow-50" : ""}>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product?.category?.name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: item.color.hex_code }}
                                />
                                <span className="text-sm">{item.color.name}</span>
                              </div>
                            )}
                            {item.size && (
                              <Badge variant="outline" className="text-xs">
                                {item.size.label}
                              </Badge>
                            )}
                            {item.material && (
                              <span className="text-xs text-muted-foreground">
                                {item.material.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStockBadge(item.stock)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={displayStock}
                            onChange={(e) => handleStockChange(item.id, item.stock, e.target.value)}
                            className={`w-20 ${hasChange ? "border-yellow-500 bg-yellow-50" : ""}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVariantId(item.id)}
                          >
                            History
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredInventory?.length} items • Direct-sync mode: Stock changes are immediate
          </p>
        </CardContent>
      </Card>

      <StockHistoryModal
        variantId={selectedVariantId}
        open={!!selectedVariantId}
        onClose={() => setSelectedVariantId(null)}
      />
    </>
  );
};

export default InventoryQuickEdit;
