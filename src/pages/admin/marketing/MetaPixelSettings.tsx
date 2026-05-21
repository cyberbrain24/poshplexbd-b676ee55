import { useEffect, useState } from "react";
import { usePixelSettings, useUpdatePixelSettings } from "@/hooks/usePixelSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Facebook, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/services/facebook-pixel.service";

const ECOM_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToCart",
  "AddToWishlist",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Purchase",
  "CompleteRegistration",
];

const MetaPixelSettings = () => {
  const { data, isLoading } = usePixelSettings();
  const update = useUpdatePixelSettings();

  const [pixelId, setPixelId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [advancedMatching, setAdvancedMatching] = useState(true);
  const [ecommerce, setEcommerce] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (data && !init) {
      setPixelId(data.meta_pixel_id || "");
      setEnabled(data.meta_pixel_enabled);
      setTestMode(data.meta_test_mode);
      setAdvancedMatching(data.meta_advanced_matching);
      setEcommerce(data.meta_ecommerce_events_enabled);
      setInit(true);
    }
  }, [data, init]);

  const save = async () => {
    if (!data) return;
    if (enabled && !pixelId.trim()) {
      toast.error("Pixel ID is required to enable tracking");
      return;
    }
    await update.mutateAsync({
      id: data.id,
      meta_pixel_id: pixelId.trim() || null,
      meta_pixel_enabled: enabled,
      meta_test_mode: testMode,
      meta_advanced_matching: advancedMatching,
      meta_ecommerce_events_enabled: ecommerce,
    });
  };

  const sendTest = () => {
    if (!enabled || !pixelId) {
      toast.error("Enable the pixel and save before testing");
      return;
    }
    trackEvent("PageView");
    toast.success("Test PageView fired — check Meta Events Manager → Test Events");
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!data) return <p className="text-sm text-muted-foreground">No settings row found.</p>;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="border border-border p-5 flex items-start gap-4 bg-muted/30">
        <div className="p-2.5 border border-border bg-background">
          <Facebook className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold">Meta Pixel</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Browser-side tracking that powers Facebook & Instagram ad attribution, retargeting, and lookalike audiences.
          </p>
          <a
            href="https://business.facebook.com/events_manager2/list/pixel"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 text-foreground hover:underline"
          >
            Open Events Manager <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Credentials */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Credentials</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Identifies your pixel in Meta's systems.</p>
        </div>
        <div>
          <Label htmlFor="pixel-id" className="text-xs">Facebook Pixel ID</Label>
          <Input
            id="pixel-id"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="mt-1 rounded-none max-w-sm font-mono"
          />
          <p className="text-[11px] text-muted-foreground mt-1">15–16 digit numeric ID from Events Manager.</p>
        </div>
      </section>

      {/* Behavior toggles */}
      <section className="border border-border p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Behavior</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Fine-tune how the pixel fires on your storefront.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <ToggleRow
            title="Enable Pixel"
            description="Activate tracking on the storefront"
            checked={enabled}
            onChange={setEnabled}
          />
          <ToggleRow
            title="Test Mode"
            description="Log events to console for debugging"
            checked={testMode}
            onChange={setTestMode}
          />
          <ToggleRow
            title="Advanced Matching"
            description="Send hashed user data for better attribution"
            checked={advancedMatching}
            onChange={setAdvancedMatching}
          />
          <ToggleRow
            title="E-Commerce Events"
            description="ViewContent, AddToCart, Purchase, etc."
            checked={ecommerce}
            onChange={setEcommerce}
          />
        </div>
      </section>

      {/* Events list */}
      <section className="border border-border p-6 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Tracked Events</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Standard events sent automatically when e-commerce tracking is enabled.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {ECOM_EVENTS.map((ev) => (
            <span
              key={ev}
              className="text-[11px] font-mono px-2 py-1 border border-border bg-muted/40 rounded-sm"
            >
              {ev}
            </span>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={update.isPending} className="rounded-none" size="sm">
          {update.isPending ? "Saving…" : "Save Pixel Settings"}
        </Button>
        <Button onClick={sendTest} variant="outline" className="rounded-none gap-2" size="sm">
          <Send className="h-4 w-4" /> Send Test PageView
        </Button>
      </div>
    </div>
  );
};

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between border border-border p-3 gap-3">
    <div className="min-w-0">
      <p className="text-sm font-medium truncate">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default MetaPixelSettings;
