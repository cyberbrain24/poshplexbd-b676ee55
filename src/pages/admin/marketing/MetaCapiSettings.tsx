import { useEffect, useState } from "react";
import { usePixelSettings, useUpdatePixelSettings } from "@/hooks/usePixelSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, ExternalLink, Send, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import MaskedTokenInput from "@/components/admin/marketing/MaskedTokenInput";
import { supabase } from "@/integrations/supabase/client";

const MetaCapiSettings = () => {
  const { data, isLoading } = usePixelSettings();
  const update = useUpdatePixelSettings();

  const [enabled, setEnabled] = useState(false);
  const [token, setToken] = useState("");
  const [testing, setTesting] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (data && !init) {
      setEnabled(data.meta_capi_enabled ?? false);
      setToken(data.meta_capi_access_token || "");
      setInit(true);
    }
  }, [data, init]);

  const save = async () => {
    if (!data) return;
    if (enabled && !token.trim()) {
      toast.error("Access token is required to enable CAPI");
      return;
    }
    await update.mutateAsync({
      id: data.id,
      meta_capi_enabled: enabled,
      meta_capi_access_token: token.trim() || null,
    });
  };

  const sendTest = async () => {
    if (!enabled || !token) {
      toast.error("Enable CAPI and save before testing");
      return;
    }
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("meta-capi", {
        body: {
          event_name: "PageView",
          event_source_url: window.location.origin,
          action_source: "website",
          test_event: true,
        },
      });
      if (error) throw error;
      toast.success("Test event sent — check Events Manager → Test Events");
    } catch (e: any) {
      toast.error("Test failed: " + (e?.message || "Unknown error"));
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-sm text-muted-foreground">No settings row found.</p>;

  const pixelLinked = !!data.meta_pixel_id;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="border border-border p-5 flex items-start gap-4 bg-muted/30">
        <div className="p-2.5 border border-border bg-background">
          <Server className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Meta Conversions API</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Server-side event mirror that recovers up to 30% of conversions lost to ad blockers and iOS privacy restrictions.
          </p>
          <a
            href="https://business.facebook.com/events_manager2/list/pixel"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 text-foreground hover:underline"
          >
            Generate token in Events Manager <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Prerequisite */}
      {!pixelLinked && (
        <div className="border border-amber-500/40 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">Pixel ID required</p>
            <p className="text-xs text-amber-700/80 mt-0.5">
              CAPI events must be linked to a Meta Pixel. Configure your Pixel ID first.
            </p>
          </div>
        </div>
      )}

      {/* Token */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Access Token</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Long-lived token from Events Manager → your Pixel → Settings → Conversions API → Generate access token.
          </p>
        </div>
        <div className="max-w-xl">
          <Label htmlFor="capi-token" className="text-xs">Meta CAPI Access Token</Label>
          <div className="mt-1">
            <MaskedTokenInput id="capi-token" value={token} onChange={setToken} placeholder="EAA..." />
          </div>
        </div>
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-1">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Stored server-side and only exposed to the Conversions API edge function.
        </div>
      </section>

      {/* Toggle */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Activation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Mirror browser events server-side with deduplication.</p>
        </div>
        <div className="flex items-center justify-between border border-border p-3">
          <div>
            <p className="text-sm font-medium">Enable Conversions API</p>
            <p className="text-xs text-muted-foreground">
              Sends a duplicate of each tracked event from the server with the same event_id for dedup.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <dl className="grid sm:grid-cols-2 gap-3 pt-2">
          <InfoRow label="Linked Pixel" value={data.meta_pixel_id || "Not set"} />
          <InfoRow label="Deduplication" value="event_id (auto)" />
        </dl>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={update.isPending} className="rounded-none" size="sm">
          {update.isPending ? "Saving…" : "Save CAPI Settings"}
        </Button>
        <Button
          onClick={sendTest}
          disabled={testing}
          variant="outline"
          className="rounded-none gap-2"
          size="sm"
        >
          <Send className="h-4 w-4" /> {testing ? "Sending…" : "Send Server Test Event"}
        </Button>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border p-3">
    <dt className="text-[11px] uppercase text-muted-foreground tracking-wide">{label}</dt>
    <dd className="text-sm font-mono mt-1 truncate">{value}</dd>
  </div>
);

export default MetaCapiSettings;
