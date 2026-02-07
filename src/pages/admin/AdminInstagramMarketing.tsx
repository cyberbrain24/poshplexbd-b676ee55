import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Play, Pause, MessageCircle, Sparkles, Send, Settings2 } from "lucide-react";
import { toast } from "sonner";
import InstagramAutomationModal from "@/components/admin/InstagramAutomationModal";
import InstagramIceBreakersModal from "@/components/admin/InstagramIceBreakersModal";
import InstagramCampaignModal from "@/components/admin/InstagramCampaignModal";
import InstagramCampaignLogsModal from "@/components/admin/InstagramCampaignLogsModal";
import { format } from "date-fns";

const AdminInstagramMarketing = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("automations");
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isIceBreakersModalOpen, setIsIceBreakersModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: automations = [], isLoading: loadingAutomations } = useQuery({
    queryKey: ["instagram-automations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["instagram-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-automations"] });
      toast.success("Automation deleted");
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("instagram_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("instagram_automations")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-automations"] });
      toast.success("Automation updated");
    },
  });

  const getAutomationTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      comment_to_dm: { label: "Comment → DM", variant: "default" },
      story_mention: { label: "Story Mention", variant: "secondary" },
    };
    const config = types[type] || { label: type, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredAutomations = automations.filter((a: any) =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCampaigns = campaigns.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Instagram Marketing</h1>
            <p className="text-muted-foreground">
              Automations, campaigns & broadcast marketing
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="automations" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Automations
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Send className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="ice-breakers" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Ice Breakers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automations" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search automations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => { setEditingAutomation(null); setIsAutomationModalOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Automation
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAutomations ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredAutomations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No automations found</TableCell>
                    </TableRow>
                  ) : (
                    filteredAutomations.map((automation: any) => (
                      <TableRow key={automation.id}>
                        <TableCell className="font-medium">{automation.name}</TableCell>
                        <TableCell>{getAutomationTypeBadge(automation.automation_type)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {automation.trigger_keywords?.slice(0, 3).map((kw: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                            ))}
                            {automation.trigger_keywords?.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{automation.trigger_keywords.length - 3}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={automation.is_active ? "default" : "secondary"}>
                            {automation.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleAutomationMutation.mutate({ id: automation.id, is_active: !automation.is_active })}
                            >
                              {automation.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingAutomation(automation); setIsAutomationModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteAutomationMutation.mutate(automation.id)}
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
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => { setEditingCampaign(null); setIsCampaignModalOpen(true); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>24h Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCampaigns ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">No campaigns found</TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.recipient_count}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.active_window_only ? "default" : "secondary"}>
                            {campaign.active_window_only ? "Enforced" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.status === "completed" ? "default" : "secondary"}>
                            {campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), "PPp") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedCampaignId(campaign.id); setIsLogsModalOpen(true); }}
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingCampaign(campaign); setIsCampaignModalOpen(true); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
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
          </TabsContent>

          <TabsContent value="ice-breakers" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">
                  Configure the menu buttons new customers see when they DM your Instagram account.
                </p>
              </div>
              <Button onClick={() => setIsIceBreakersModalOpen(true)} className="gap-2">
                <Settings2 className="h-4 w-4" />
                Manage Ice Breakers
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <InstagramAutomationModal
        open={isAutomationModalOpen}
        onOpenChange={setIsAutomationModalOpen}
        editingAutomation={editingAutomation}
      />

      <InstagramIceBreakersModal
        open={isIceBreakersModalOpen}
        onOpenChange={setIsIceBreakersModalOpen}
      />

      <InstagramCampaignModal
        open={isCampaignModalOpen}
        onOpenChange={setIsCampaignModalOpen}
        editingCampaign={editingCampaign}
      />

      <InstagramCampaignLogsModal
        open={isLogsModalOpen}
        onOpenChange={setIsLogsModalOpen}
        campaignId={selectedCampaignId}
      />
    </>
  );
};

export default AdminInstagramMarketing;
