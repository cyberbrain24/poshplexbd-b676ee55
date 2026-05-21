import { usePixelSettings } from "@/hooks/usePixelSettings";
import ChannelStatusCard, { ChannelStatus } from "@/components/admin/marketing/ChannelStatusCard";
import { Facebook, Server, BarChart3, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const mask = (s: string | null | undefined, keep = 4) => {
  if (!s) return "—";
  if (s.length <= keep) return "•".repeat(s.length);
  return "•".repeat(Math.max(4, s.length - keep)) + s.slice(-keep);
};

const MarketingOverview = () => {
  const { data, isLoading } = usePixelSettings();

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full" />
        ))}
      </div>
    );
  }
  if (!data) return <p className="text-sm text-muted-foreground">No settings row found.</p>;

  const pixelStatus: ChannelStatus = !data.meta_pixel_id
    ? "missing"
    : data.meta_pixel_enabled
    ? "live"
    : "disabled";

  const capiStatus: ChannelStatus = !data.meta_capi_access_token
    ? "missing"
    : data.meta_capi_enabled
    ? "live"
    : "configured";

  const ga4Status: ChannelStatus = !data.ga4_measurement_id
    ? "missing"
    : data.ga4_enabled
    ? "live"
    : "disabled";

  const liveCount = [pixelStatus, capiStatus, ga4Status].filter((s) => s === "live").length;

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="border border-border bg-muted/30 p-5 flex items-center gap-4">
        <div className="p-3 border border-border bg-background">
          <Activity className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {liveCount} of 3 channels live
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track conversions across Meta and Google to power your retargeting and attribution.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ChannelStatusCard
          title="Meta Pixel"
          description="Browser-side event tracking for Facebook & Instagram ads"
          icon={Facebook}
          status={pixelStatus}
          href="/admin/marketing/meta-pixel"
          details={[
            { label: "Pixel ID", value: data.meta_pixel_id || "Not set" },
            { label: "Test Mode", value: data.meta_test_mode ? "On" : "Off" },
            { label: "Advanced Matching", value: data.meta_advanced_matching ? "On" : "Off" },
          ]}
        />

        <ChannelStatusCard
          title="Meta Conversions API"
          description="Server-side event mirror — recovers ~30% of lost events"
          icon={Server}
          status={capiStatus}
          href="/admin/marketing/meta-capi"
          details={[
            { label: "Access Token", value: mask(data.meta_capi_access_token) },
            { label: "Pixel Linked", value: data.meta_pixel_id || "Not set" },
          ]}
        />

        <ChannelStatusCard
          title="Google Analytics 4"
          description="Site analytics, audiences, and conversion reports"
          icon={BarChart3}
          status={ga4Status}
          href="/admin/marketing/ga4"
          details={[
            { label: "Measurement ID", value: data.ga4_measurement_id || "Not set" },
          ]}
        />

        <div className="border border-dashed border-border p-5 flex flex-col items-start justify-center gap-2 bg-muted/20">
          <span className="text-[10px] font-medium uppercase px-2 py-1 border border-border rounded-sm text-muted-foreground">
            Coming Soon
          </span>
          <h3 className="text-sm font-semibold">TikTok Pixel · Google Ads</h3>
          <p className="text-xs text-muted-foreground">
            Additional channels will plug into this hub as they're released.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketingOverview;
