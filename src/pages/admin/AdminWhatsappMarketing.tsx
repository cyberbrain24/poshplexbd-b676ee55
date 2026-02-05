import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Play, Pause, Eye, FileText, MessageCircle } from "lucide-react";
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
import { format } from "date-fns";
import WhatsappCampaignModal from "@/components/admin/WhatsappCampaignModal";
import WhatsappCampaignLogsModal from "@/components/admin/WhatsappCampaignLogsModal";
import WhatsappTemplatesModal from "@/components/admin/WhatsappTemplatesModal";

const AdminWhatsappMarketing = () => {
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["whatsapp-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_campaigns")
        .select(`
          *,
          whatsapp_templates (name, template_type, status)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whatsapp_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting campaign", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("whatsapp_campaigns")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-campaigns"] });
      toast({ title: "Campaign status updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setIsCampaignModalOpen(true);
  };

  const handleViewLogs = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsLogsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "secondary",
      scheduled: "outline",
      active: "default",
      paused: "secondary",
      completed: "default",
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  const getCampaignTypeLabel = (type: string, automationType?: string) => {
    if (automationType) {
      const labels: Record<string, string> = {
        welcome: "Welcome Series",
        order_placed: "Order Placed",
        order_shipped: "Order Shipped",
        cart_abandoned: "Cart Abandoned",
        birthday: "Birthday",
      };
      return labels[automationType] || automationType;
    }
    return type === "one-time" ? "One-time" : type === "scheduled" ? "Scheduled" : "Automated";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">WhatsApp Marketing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage WhatsApp campaigns with rich media
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsTemplatesModalOpen(true)} className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </Button>
            <Button onClick={() => setIsCampaignModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : campaigns?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No campaigns created yet
                  </TableCell>
                </TableRow>
              ) : (
                campaigns?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      {campaign.whatsapp_templates ? (
                        <div className="flex items-center gap-2">
                          <span>{campaign.whatsapp_templates.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {campaign.whatsapp_templates.template_type}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getCampaignTypeLabel(campaign.campaign_type, campaign.automation_type)}
                    </TableCell>
                    <TableCell>{campaign.recipient_count}</TableCell>
                    <TableCell>
                      {campaign.last_run_at
                        ? format(new Date(campaign.last_run_at), "MMM d, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {campaign.next_run_at
                        ? format(new Date(campaign.next_run_at), "MMM d, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {campaign.campaign_type !== "one-time" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: campaign.id,
                                status: campaign.status,
                              })
                            }
                          >
                            {campaign.status === "active" ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewLogs(campaign.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(campaign.id)}
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

      <WhatsappCampaignModal
        open={isCampaignModalOpen}
        onClose={() => {
          setIsCampaignModalOpen(false);
          setEditingCampaign(null);
        }}
        editingCampaign={editingCampaign}
      />

      <WhatsappTemplatesModal
        open={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
      />

      <WhatsappCampaignLogsModal
        open={isLogsModalOpen}
        onClose={() => {
          setIsLogsModalOpen(false);
          setSelectedCampaignId(null);
        }}
        campaignId={selectedCampaignId}
      />
    </AdminLayout>
  );
};

export default AdminWhatsappMarketing;
