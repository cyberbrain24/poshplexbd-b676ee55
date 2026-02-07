import { useState } from "react";
import { 
  Package, 
  Settings2, 
  ShoppingCart, 
  Wallet, 
  Users, 
  MessageSquare, 
  Mail, 
  MessageCircle, 
  Globe,
  LayoutDashboard,
  Puzzle,
  Lock,
  Instagram,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useModules, useToggleModule, SystemModule } from "@/hooks/useModules";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Package,
  Settings2,
  ShoppingCart,
  Wallet,
  Users,
  MessageSquare,
  Mail,
  MessageCircle,
  Globe,
  LayoutDashboard,
  Puzzle,
  Instagram,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Package;
};

const ModuleCard = ({ module, onToggle, isToggling }: { 
  module: SystemModule; 
  onToggle: (id: string, isActive: boolean) => void;
  isToggling: boolean;
}) => {
  const Icon = getIcon(module.icon);

  return (
    <Card className={!module.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${module.is_active ? "bg-primary/10" : "bg-muted"}`}>
              <Icon className={`h-5 w-5 ${module.is_active ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {module.name}
                {module.is_core && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Core
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {module.description}
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={module.is_active}
            onCheckedChange={(checked) => onToggle(module.id, checked)}
            disabled={module.is_core || isToggling}
            aria-label={`Toggle ${module.name}`}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1">
          {module.routes.map((route) => (
            <Badge key={route} variant="outline" className="text-xs font-mono">
              {route.replace('/admin/', '')}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminModules = () => {
  const { data: modules, isLoading } = useModules();
  const toggleModule = useToggleModule();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    await toggleModule.mutateAsync({ id, is_active: isActive });
    setTogglingId(null);
  };

  // Group modules by category
  const coreModules = modules?.filter(m => m.is_core) || [];
  const productModules = modules?.filter(m => ['products', 'product_edits'].includes(m.module_key)) || [];
  const orderModules = modules?.filter(m => m.module_key === 'orders') || [];
  const accountModules = modules?.filter(m => ['accounts', 'account_edits'].includes(m.module_key)) || [];
  const customerModules = modules?.filter(m => ['customers', 'customer_edits'].includes(m.module_key)) || [];
  const marketingModules = modules?.filter(m => m.module_key.includes('marketing')) || [];
  const settingsModules = modules?.filter(m => ['seo', 'site_settings'].includes(m.module_key)) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Module Manager</h1>
          <p className="text-muted-foreground">Activate or deactivate system modules</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-4 w-32 mt-2" />
                <Skeleton className="h-3 w-48 mt-1" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Module Manager</h1>
        <p className="text-muted-foreground">
          Activate or deactivate system modules. Deactivated modules will be hidden from the sidebar and their routes will be inaccessible.
        </p>
      </div>

      {/* Core Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Core Modules
          <Badge variant="secondary" className="ml-2">Always Active</Badge>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coreModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Product Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Product Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {productModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Order Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Order & Inventory</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orderModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Account Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Financial</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Customer Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Customer Management</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customerModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Marketing Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Marketing & Messaging</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketingModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>

      {/* Settings Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Site Configuration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onToggle={handleToggle}
              isToggling={togglingId === module.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminModules;
