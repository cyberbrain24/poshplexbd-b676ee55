 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { supabase } from "@/integrations/supabase/client";
 import { useQuery } from "@tanstack/react-query";
 import { format } from "date-fns";
 import { ScrollArea } from "@/components/ui/scroll-area";
 
 interface SmsCampaign {
   id: string;
   name: string;
   message: string;
 }
 
 interface SmsCampaignLogsModalProps {
   open: boolean;
   onClose: () => void;
   campaign: SmsCampaign | null;
 }
 
 const SmsCampaignLogsModal = ({ open, onClose, campaign }: SmsCampaignLogsModalProps) => {
   const { data: logs = [], isLoading } = useQuery({
     queryKey: ["sms-campaign-logs", campaign?.id],
     queryFn: async () => {
       if (!campaign) return [];
       const { data, error } = await supabase
         .from("sms_campaign_logs")
         .select("*, customers(name)")
         .eq("campaign_id", campaign.id)
         .order("created_at", { ascending: false })
         .limit(100);
       if (error) throw error;
       return data;
     },
     enabled: !!campaign,
   });
 
   const getStatusBadge = (status: string) => {
     switch (status) {
       case "sent":
         return <Badge className="bg-green-500">Sent</Badge>;
       case "failed":
         return <Badge variant="destructive">Failed</Badge>;
       default:
         return <Badge variant="secondary">Pending</Badge>;
     }
   };
 
   return (
     <Dialog open={open} onOpenChange={onClose}>
       <DialogContent className="max-w-3xl max-h-[80vh]">
         <DialogHeader>
           <DialogTitle>Campaign Logs: {campaign?.name}</DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="h-[500px]">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Customer</TableHead>
                 <TableHead>Phone</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Sent At</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {isLoading ? (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                     Loading...
                   </TableCell>
                 </TableRow>
               ) : logs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                     No logs found for this campaign.
                   </TableCell>
                 </TableRow>
               ) : (
                 logs.map((log) => (
                   <TableRow key={log.id}>
                     <TableCell>{(log.customers as { name: string })?.name || "Unknown"}</TableCell>
                     <TableCell>{log.phone}</TableCell>
                     <TableCell>{getStatusBadge(log.status)}</TableCell>
                     <TableCell>
                       {log.sent_at
                         ? format(new Date(log.sent_at), "MMM d, yyyy HH:mm")
                         : "-"}
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </ScrollArea>
       </DialogContent>
     </Dialog>
   );
 };
 
 export default SmsCampaignLogsModal;