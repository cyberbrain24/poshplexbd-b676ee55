import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { invalidateMetaConfig } from "@/lib/meta-pixel";

const AdminMetaPixel = () => {
  const [pixelId, setPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [ecommerceEnabled, setEcommerceEnabled] = useState(false);
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [capiToken, setCapiToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("meta_pixel_id, meta_pixel_enabled, meta_ecommerce_events_enabled, meta_capi_enabled, meta_capi_access_token")
        .limit(1)
        .maybeSingle();

      if (data) {
        setPixelId(data.meta_pixel_id ?? "");
        setPixelEnabled(data.meta_pixel_enabled ?? false);
        setEcommerceEnabled(data.meta_ecommerce_events_enabled ?? false);
        setCapiEnabled(data.meta_capi_enabled ?? false);
        setCapiToken(data.meta_capi_access_token ?? "");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({
        meta_pixel_id: pixelId.trim() || null,
        meta_pixel_enabled: pixelEnabled,
        meta_ecommerce_events_enabled: ecommerceEnabled,
        meta_capi_enabled: capiEnabled,
        meta_capi_access_token: capiToken.trim() || null,
      })
      .not("id", "is", null);

    if (error) {
      toast.error("Failed to save settings");
    } else {
      invalidateMetaConfig();
      toast.success("Meta Pixel settings saved");
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
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Meta Pixel</h1>
        <p className="text-muted-foreground mt-1">Configure Meta (Facebook) tracking pixel and events</p>
      </div>

      <div className="border border-border p-6 space-y-6">
        <h2 className="font-medium">Pixel Settings</h2>

        <div className="space-y-4 max-w-md">
          {/* Pixel ID */}
          <div className="space-y-2">
            <Label htmlFor="pixel-id">Meta Pixel ID</Label>
            <Input
              id="pixel-id"
              placeholder="123456789012345"
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Find this in Meta Events Manager → Data Sources → Your Pixel
            </p>
          </div>

          {/* Enable Pixel */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pixel-toggle">Enable Pixel</Label>
              <p className="text-xs text-muted-foreground">Inject Meta Pixel on all storefront pages</p>
            </div>
            <Switch id="pixel-toggle" checked={pixelEnabled} onCheckedChange={setPixelEnabled} />
          </div>

          {/* Enable E-commerce Events */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ecom-toggle">Enable E-commerce Events</Label>
              <p className="text-xs text-muted-foreground">Track ViewContent, AddToCart, Purchase, etc.</p>
            </div>
            <Switch id="ecom-toggle" checked={ecommerceEnabled} onCheckedChange={setEcommerceEnabled} />
          </div>

          {/* Enable CAPI */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="capi-toggle">Enable Conversion API</Label>
              <p className="text-xs text-muted-foreground">Send server-side Purchase events for better attribution</p>
            </div>
            <Switch id="capi-toggle" checked={capiEnabled} onCheckedChange={setCapiEnabled} />
          </div>

          {/* CAPI Token (shown only when CAPI enabled) */}
          {capiEnabled && (
            <div className="space-y-2">
              <Label htmlFor="capi-token">Conversion API Access Token</Label>
              <Input
                id="capi-token"
                type="password"
                placeholder="EAAxxxxxxxxx..."
                value={capiToken}
                onChange={(e) => setCapiToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Generate in Meta Events Manager → Settings → Conversions API
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminMetaPixel;
