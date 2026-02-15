import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart3, Users, Globe, MapPin, Monitor, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const GA4_ANALYTICS_URL = "https://analytics.google.com/";

const overviewCards = [
  { icon: Users, label: "Realtime Visitors", description: "View live visitor activity" },
  { icon: Globe, label: "Traffic Sources", description: "See where visitors come from" },
  { icon: MapPin, label: "Locations", description: "Geographic visitor breakdown" },
  { icon: Monitor, label: "Device Breakdown", description: "Desktop, mobile & tablet split" },
];

const AdminAnalytics = () => {
  const [measurementId, setMeasurementId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("ga4_enabled, ga4_measurement_id")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setEnabled(data.ga4_enabled ?? false);
        setMeasurementId(data.ga4_measurement_id ?? "");
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        ga4_enabled: enabled,
        ga4_measurement_id: measurementId.trim() || null,
      })
      .not("id", "is", null); // update all (single row)

    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Analytics settings saved");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Website visitor tracking overview</p>
      </div>

      {/* GA4 Settings Card */}
      <div className="border border-border p-6 space-y-6">
        <h2 className="font-medium">Google Analytics Settings</h2>

        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="ga4-id">GA4 Measurement ID</Label>
            <Input
              id="ga4-id"
              placeholder="G-XXXXXXXXXX"
              value={measurementId}
              onChange={(e) => setMeasurementId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Google Analytics → Admin → Data Streams
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ga4-toggle">Enable Analytics</Label>
              <p className="text-xs text-muted-foreground">
                Inject GA4 tracking on all storefront pages
              </p>
            </div>
            <Switch
              id="ga4-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Visitor Overview Cards */}
      <div>
        <h2 className="font-medium mb-4">Visitor Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards.map((card) => (
            <div key={card.label} className="border border-border p-6 space-y-3">
              <card.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{card.label}</p>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
              <a
                href={GA4_ANALYTICS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Analytics
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
