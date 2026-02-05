import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, RefreshCw, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import WhatsappApiModal from "@/components/admin/WhatsappApiModal";

const AdminWhatsappApi = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApi, setEditingApi] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apis, isLoading } = useQuery({
    queryKey: ["whatsapp-apis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_apis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_apis").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-apis"] });
      toast({ title: "WhatsApp API deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting API", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (api: any) => {
    setEditingApi(api);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingApi(null);
  };

  const getProviderLabel = (type: string) => {
    switch (type) {
      case "meta": return "Meta Cloud API";
      case "twilio": return "Twilio";
      case "custom": return "Custom";
      default: return type;
    }
  };

  const getQualityBadge = (rating: string) => {
    switch (rating) {
      case "green": return <Badge className="bg-green-500">Green</Badge>;
      case "yellow": return <Badge className="bg-yellow-500">Yellow</Badge>;
      case "red": return <Badge className="bg-red-500">Red</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">WhatsApp API Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage WhatsApp Business API connections
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add API
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Business Account</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : apis?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No WhatsApp APIs configured
                  </TableCell>
                </TableRow>
              ) : (
                apis?.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{api.provider_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {getProviderLabel(api.provider_type)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{api.phone_number || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {api.business_account_id ? api.business_account_id.slice(0, 12) + "..." : "-"}
                    </TableCell>
                    <TableCell>{getQualityBadge(api.quality_rating)}</TableCell>
                    <TableCell>
                      {api.status === "connected" ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {api.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(api)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(api.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <WhatsappApiModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editingApi={editingApi}
      />
    </AdminLayout>
  );
};

export default AdminWhatsappApi;
