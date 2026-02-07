import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, AlertTriangle, History, Edit } from "lucide-react";
import InventoryQuickEdit from "@/components/admin/InventoryQuickEdit";
import LowStockAlerts from "@/components/admin/LowStockAlerts";
import InventoryLedger from "@/components/admin/InventoryLedger";

const AdminInventory = () => {
  const [activeTab, setActiveTab] = useState("quick-edit");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Real-time stock management with direct-sync inventory logic
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
            <TabsTrigger value="quick-edit" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Quick Edit
            </TabsTrigger>
            <TabsTrigger value="low-stock" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Audit Ledger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick-edit" className="mt-6">
            <InventoryQuickEdit />
          </TabsContent>

          <TabsContent value="low-stock" className="mt-6">
            <LowStockAlerts />
          </TabsContent>

          <TabsContent value="ledger" className="mt-6">
            <InventoryLedger />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
