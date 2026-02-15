import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrackingEvent {
  id: string;
  event_type: string;
  status: string;
  created_at: string;
}

const AdminEventMonitor = () => {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("tracking_events")
        .select("id, event_type, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      setEvents((data as TrackingEvent[]) ?? []);
    } catch {
      /* fail silently */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Event Monitor</h1>
          <p className="text-muted-foreground mt-1">Last 50 tracking events</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 font-medium">Event Type</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && !loading && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-muted-foreground">
                  No tracking events recorded yet
                </td>
              </tr>
            )}
            {events.map((event) => (
              <tr key={event.id} className="border-b border-border last:border-b-0">
                <td className="p-3 font-medium">{event.event_type}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                      event.status === "success"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {event.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">
                  {format(new Date(event.created_at), "MMM d, yyyy HH:mm:ss")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEventMonitor;
