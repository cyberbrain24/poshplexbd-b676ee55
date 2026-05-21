import { useEffect, useState } from "react";
import { usePixelSettings, useUpdatePixelSettings } from "@/hooks/usePixelSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const GA4_REGEX = /^G-[A-Z0-9]{6,}$/i;

const GA4Settings = () => {
  const { data, isLoading } = usePixelSettings();
  const update = useUpdatePixelSettings();

  const [enabled, setEnabled] = useState(false);
  const [measurementId, setMeasurementId] = useState("");
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (data && !init) {
      setEnabled(data.ga4_enabled ?? false);
      setMeasurementId(data.ga4_measurement_id || "");
      setInit(true);
    }
  }, [data, init]);

  const valid = !measurementId || GA4_REGEX.test(measurementId);

  const save = async () => {
    if (!data) return;
    if (enabled && !measurementId.trim()) {
      toast.error("Measurement ID is required to enable GA4");
      return;
    }
    if (measurementId && !GA4_REGEX.test(measurementId)) {
      toast.error("Measurement ID must look like G-XXXXXXXXXX");
      return;
    }
    await update.mutateAsync({
      id: data.id,
      ga4_enabled: enabled,
      ga4_measurement_id: measurementId.trim() || null,
    });
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-sm text-muted-foreground">No settings row found.</p>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="border border-border p-5 flex items-start gap-4 bg-muted/30">
        <div className="p-2.5 border border-border bg-background">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Google Analytics 4</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Web traffic analytics, audience insights, and conversion reporting powered by Google.
          </p>
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 text-foreground hover:underline"
          >
            Open Google Analytics <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Credentials */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Measurement ID</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Find this in Analytics → Admin → Data Streams → your web stream.
          </p>
        </div>
        <div>
          <Label htmlFor="ga4-id" className="text-xs">GA4 Measurement ID</Label>
          <Input
            id="ga4-id"
            value={measurementId}
            onChange={(e) => setMeasurementId(e.target.value.toUpperCase())}
            placeholder="G-XXXXXXXXXX"
            className="mt-1 rounded-none max-w-sm font-mono"
          />
          {measurementId && (
            <div
              className={`mt-2 inline-flex items-center gap-1.5 text-xs ${
                valid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {valid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {valid ? "Valid format" : "Should match G-XXXXXXXXXX"}
            </div>
          )}
        </div>
      </section>

      {/* Toggle */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Activation</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Load gtag.js across the storefront.</p>
        </div>
        <div className="flex items-center justify-between border border-border p-3">
          <div>
            <p className="text-sm font-medium">Enable GA4 Tracking</p>
            <p className="text-xs text-muted-foreground">
              Automatically reports page_view and enhanced measurement events.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </section>

      <div>
        <Button onClick={save} disabled={update.isPending} className="rounded-none" size="sm">
          {update.isPending ? "Saving…" : "Save GA4 Settings"}
        </Button>
      </div>
    </div>
  );
};

export default GA4Settings;
