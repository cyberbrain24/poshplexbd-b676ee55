import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Eye, MousePointer } from "lucide-react";

interface InstagramCampaignLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
}

const InstagramCampaignLogsModal = ({ open, onOpenChange, campaignId }: InstagramCampaignLogsModalProps) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["instagram-campaign-logs", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("instagram_campaign_logs")
        .select(`
          *,
          customers (name, phone)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!campaignId,
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["instagram-analytics", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const logIds = logs.map((l: any) => l.id);
      if (logIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("instagram_analytics")
        .select("*")
        .in("log_id", logIds);
      if (error) throw error;
      return data;
    },
    enabled: open && logs.length > 0,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "read":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "failed":
      case "blocked":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      delivered: "default",
      read: "default",
      failed: "destructive",
      blocked: "destructive",
      pending: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  // Calculate stats
  const stats = {
    total: logs.length,
    sent: logs.filter((l: any) => l.status === "sent" || l.status === "delivered").length,
    read: logs.filter((l: any) => l.status === "read").length,
    failed: logs.filter((l: any) => l.status === "failed" || l.status === "blocked").length,
    clicked: analytics.filter((a: any) => a.event_type === "link_click").length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Logs & Analytics</DialogTitle>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
            <p className="text-sm text-muted-foreground">Read</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.clicked}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MousePointer className="h-3 w-3" /> Clicks
            </p>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instagram User</TableHead>
                <TableHead>Linked Customer</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No logs found</TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">@{log.instagram_username || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{log.instagram_user_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.customers ? (
                        <div>
                          <p className="font-medium">{log.customers.name}</p>
                          <p className="text-xs text-muted-foreground">{log.customers.phone}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.trigger_type || "campaign"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? format(new Date(log.sent_at), "PPp") : "-"}
                    </TableCell>
                    <TableCell>
                      {log.error_message && (
                        <span className="text-xs text-destructive">{log.error_message}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstagramCampaignLogsModal;
