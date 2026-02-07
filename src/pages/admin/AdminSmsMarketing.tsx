import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Plus, Pencil, Trash2, Play, Pause, Eye, History } from "lucide-react";
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
 import { useToast } from "@/hooks/use-toast";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import SmsCampaignModal from "@/components/admin/SmsCampaignModal";
 import SmsCampaignLogsModal from "@/components/admin/SmsCampaignLogsModal";
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
 } from "@/components/ui/alert-dialog";
 import { format } from "date-fns";
 
 interface SmsCampaign {
   id: string;
   name: string;
   message: string;
   campaign_type: string;
   status: string;
   filters: Record<string, unknown>;
   schedule_config: Record<string, unknown>;
   is_birthday_campaign: boolean;
   birthday_send_time: string | null;
   recipient_count: number;
   last_run_at: string | null;
   next_run_at: string | null;
   created_at: string;
 }
 
 const AdminSmsMarketing = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingCampaign, setEditingCampaign] = useState<SmsCampaign | null>(null);
   const [deletingCampaign, setDeletingCampaign] = useState<SmsCampaign | null>(null);
   const [viewingLogs, setViewingLogs] = useState<SmsCampaign | null>(null);
   const [isBirthdayMode, setIsBirthdayMode] = useState(false);
   const { toast } = useToast();
   const queryClient = useQueryClient();
 
   const { data: campaigns = [], isLoading } = useQuery({
     queryKey: ["sms-campaigns"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("sms_campaigns")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data as SmsCampaign[];
     },
   });
 
   const regularCampaigns = campaigns.filter((c) => !c.is_birthday_campaign);
   const birthdayCampaigns = campaigns.filter((c) => c.is_birthday_campaign);
 
   const deleteMutation = useMutation({
     mutationFn: async (id: string) => {
       const { error } = await supabase.from("sms_campaigns").delete().eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-campaigns"] });
       toast({ title: "Campaign deleted successfully" });
       setDeletingCampaign(null);
     },
     onError: (error) => {
       toast({ title: "Error deleting campaign", description: error.message, variant: "destructive" });
     },
   });
 
   const toggleStatusMutation = useMutation({
     mutationFn: async (campaign: SmsCampaign) => {
       const newStatus = campaign.status === "active" ? "paused" : "active";
       const { error } = await supabase
         .from("sms_campaigns")
         .update({ status: newStatus })
         .eq("id", campaign.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["sms-campaigns"] });
       toast({ title: "Campaign status updated" });
     },
     onError: (error) => {
       toast({ title: "Error updating status", description: error.message, variant: "destructive" });
     },
   });
 
   const handleEdit = (campaign: SmsCampaign) => {
     setEditingCampaign(campaign);
     setIsBirthdayMode(campaign.is_birthday_campaign);
     setIsModalOpen(true);
   };
 
   const handleAddNew = (birthday: boolean) => {
     setEditingCampaign(null);
     setIsBirthdayMode(birthday);
     setIsModalOpen(true);
   };
 
   const handleModalClose = () => {
     setIsModalOpen(false);
     setEditingCampaign(null);
   };
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "active":
         return <Badge className="bg-green-500">Active</Badge>;
       case "paused":
         return <Badge variant="secondary">Paused</Badge>;
       case "completed":
         return <Badge variant="outline">Completed</Badge>;
       default:
         return <Badge variant="secondary">Draft</Badge>;
     }
   };
 
   const CampaignTable = ({ data, showBirthdayColumn = false }: { data: SmsCampaign[]; showBirthdayColumn?: boolean }) => (
     <Table>
       <TableHeader>
         <TableRow>
           <TableHead>Campaign Name</TableHead>
           <TableHead>Type</TableHead>
           {showBirthdayColumn && <TableHead>Send Time</TableHead>}
           <TableHead>Recipients</TableHead>
           <TableHead>Last Run</TableHead>
           <TableHead>Status</TableHead>
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
         ) : data.length === 0 ? (
           <TableRow>
             <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
               No campaigns found. Create one to get started.
             </TableCell>
           </TableRow>
         ) : (
           data.map((campaign) => (
             <TableRow key={campaign.id}>
               <TableCell className="font-medium">{campaign.name}</TableCell>
               <TableCell className="capitalize">{campaign.campaign_type}</TableCell>
               {showBirthdayColumn && (
                 <TableCell>{campaign.birthday_send_time || "09:00"}</TableCell>
               )}
               <TableCell>{campaign.recipient_count}</TableCell>
               <TableCell>
                 {campaign.last_run_at
                   ? format(new Date(campaign.last_run_at), "MMM d, yyyy HH:mm")
                   : "-"}
               </TableCell>
               <TableCell>{getStatusBadge(campaign.status)}</TableCell>
               <TableCell className="text-right">
                 <div className="flex items-center justify-end gap-1">
                   {campaign.campaign_type !== "one-time" && (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => toggleStatusMutation.mutate(campaign)}
                       title={campaign.status === "active" ? "Pause" : "Resume"}
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
                     onClick={() => setViewingLogs(campaign)}
                     title="View Logs"
                   >
                     <History className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                     <Pencil className="h-4 w-4" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => setDeletingCampaign(campaign)}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </TableCell>
             </TableRow>
           ))
         )}
       </TableBody>
     </Table>
   );
 
   return (
     <>
       <div className="space-y-6">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-semibold tracking-tight">SMS Marketing</h1>
             <p className="text-sm text-muted-foreground mt-1">
               Create and manage SMS campaigns with advanced customer targeting.
             </p>
           </div>
         </div>
 
         <Tabs defaultValue="campaigns" className="space-y-4">
           <TabsList>
             <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
             <TabsTrigger value="birthday">Birthday Auto SMS</TabsTrigger>
           </TabsList>
 
           <TabsContent value="campaigns" className="space-y-4">
             <div className="flex justify-end">
               <Button onClick={() => handleAddNew(false)} size="sm">
                 <Plus className="h-4 w-4 mr-2" />
                 Create Campaign
               </Button>
             </div>
             <div className="border rounded-lg">
               <CampaignTable data={regularCampaigns} />
             </div>
           </TabsContent>
 
           <TabsContent value="birthday" className="space-y-4">
             <div className="flex justify-end">
               <Button onClick={() => handleAddNew(true)} size="sm">
                 <Plus className="h-4 w-4 mr-2" />
                 Create Birthday Campaign
               </Button>
             </div>
             <div className="border rounded-lg">
               <CampaignTable data={birthdayCampaigns} showBirthdayColumn />
             </div>
           </TabsContent>
         </Tabs>
       </div>
 
       <SmsCampaignModal
         open={isModalOpen}
         onClose={handleModalClose}
         editingCampaign={editingCampaign}
         isBirthdayMode={isBirthdayMode}
       />
 
       <SmsCampaignLogsModal
         open={!!viewingLogs}
         onClose={() => setViewingLogs(null)}
         campaign={viewingLogs}
       />
 
       <AlertDialog open={!!deletingCampaign} onOpenChange={() => setDeletingCampaign(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
             <AlertDialogDescription>
               Are you sure you want to delete "{deletingCampaign?.name}"? This will also delete all
               associated logs. This action cannot be undone.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => deletingCampaign && deleteMutation.mutate(deletingCampaign.id)}
             >
               Delete
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };
 
 export default AdminSmsMarketing;