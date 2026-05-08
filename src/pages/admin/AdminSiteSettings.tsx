import { useState, useRef, useEffect } from "react";
import { useSiteBranding, useUpdateSiteBranding, useUploadBrandingAsset } from "@/hooks/useSiteBranding";
import { usePixelSettings, useUpdatePixelSettings } from "@/hooks/usePixelSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon, Monitor, Smartphone, Activity, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AdminSiteSettings = () => {
  const { data: branding, isLoading } = useSiteBranding();
  const updateMutation = useUpdateSiteBranding();
  const uploadMutation = useUploadBrandingAsset();
  const { data: pixelSettings, isLoading: loadingPixel } = usePixelSettings();
  const updatePixelMutation = useUpdatePixelSettings();

  const { data: geminiStatus, isLoading: loadingGemini, refetch: refetchGemini } = useQuery({
    queryKey: ["gemini-credentials-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gemini-credentials-status");
      if (error) throw error;
      return data as { gemini_configured: boolean; gemini_masked: string | null; gemini_source: string | null; lovable_ai_configured: boolean; active_provider: string };
    },
  });

  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [savingGemini, setSavingGemini] = useState(false);

  const handleSaveGeminiKey = async () => {
    const key = geminiKeyInput.trim();
    if (!key) { toast.error("Please enter a Gemini API key"); return; }
    if (key.length < 20) { toast.error("That doesn't look like a valid API key"); return; }
    setSavingGemini(true);
    const { data: row } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    if (!row) { toast.error("Site settings row not found"); setSavingGemini(false); return; }
    const { error } = await supabase.from("site_settings").update({ gemini_api_key: key }).eq("id", row.id);
    setSavingGemini(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gemini API key saved");
    setGeminiKeyInput("");
    refetchGemini();
  };

  const handleClearGeminiKey = async () => {
    if (!confirm("Remove the saved Gemini API key? AI will fall back to Lovable AI Gateway.")) return;
    setSavingGemini(true);
    const { data: row } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    if (!row) { setSavingGemini(false); return; }
    const { error } = await supabase.from("site_settings").update({ gemini_api_key: null }).eq("id", row.id);
    setSavingGemini(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Gemini API key removed");
    refetchGemini();
  };

  const [siteName, setSiteName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Pixel form state
  const [pixelId, setPixelId] = useState("");
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [advancedMatching, setAdvancedMatching] = useState(true);
  const [ecommerceEvents, setEcommerceEvents] = useState(false);
  const [pixelInitialized, setPixelInitialized] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const desktopHeroRef = useRef<HTMLInputElement>(null);
  const mobileHeroRef = useRef<HTMLInputElement>(null);

  // Initialize form when data loads
  if (branding && !initialized) {
    setSiteName(branding.site_name);
    setSlogan(branding.slogan);
    setInitialized(true);
  }

  // Initialize pixel form
  useEffect(() => {
    if (pixelSettings && !pixelInitialized) {
      setPixelId(pixelSettings.meta_pixel_id || "");
      setPixelEnabled(pixelSettings.meta_pixel_enabled);
      setTestMode(pixelSettings.meta_test_mode);
      setAdvancedMatching(pixelSettings.meta_advanced_matching);
      setEcommerceEvents(pixelSettings.meta_ecommerce_events_enabled);
      setPixelInitialized(true);
    }
  }, [pixelSettings, pixelInitialized]);

  const handleSavePixel = async () => {
    if (!pixelSettings) return;
    await updatePixelMutation.mutateAsync({
      id: pixelSettings.id,
      meta_pixel_id: pixelId.trim() || null,
      meta_pixel_enabled: pixelEnabled,
      meta_test_mode: testMode,
      meta_advanced_matching: advancedMatching,
      meta_ecommerce_events_enabled: ecommerceEvents,
    });
  };

  const handleUpload = async (
    file: File,
    folder: string,
    field: "logo_url" | "desktop_hero_url" | "mobile_hero_url"
  ) => {
    if (!branding) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 2MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `branding/${folder}/${Date.now()}.${ext}`;
    const url = await uploadMutation.mutateAsync({ file, path });
    await updateMutation.mutateAsync({ id: branding.id, [field]: url });
  };

  const handleRemoveImage = async (field: "logo_url" | "desktop_hero_url" | "mobile_hero_url") => {
    if (!branding) return;
    await updateMutation.mutateAsync({ id: branding.id, [field]: null });
  };

  const handleSaveText = async () => {
    if (!branding) return;
    await updateMutation.mutateAsync({
      id: branding.id,
      site_name: siteName.trim() || "POSHPLEX",
      slogan: slogan.trim(),
    });
  };

  const handleToggleHero = async () => {
    if (!branding) return;
    await updateMutation.mutateAsync({
      id: branding.id,
      hero_enabled: !branding.hero_enabled,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!branding) {
    return <div className="p-6 text-muted-foreground">No branding data found.</div>;
  }

  const isUploading = uploadMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-medium mb-1">Site Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your logo, hero banners, and site identity.</p>

      {/* Site Identity */}
      <section className="border border-border p-6 mb-8">
        <h2 className="text-base font-medium mb-4">Site Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-sm">Site Name</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="mt-1 rounded-none"
              placeholder="POSHPLEX"
            />
          </div>
          <div>
            <Label className="text-sm">Slogan</Label>
            <Input
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="mt-1 rounded-none"
              placeholder="BE POSH WITH POSHPLEX"
            />
          </div>
        </div>
        <Button
          onClick={handleSaveText}
          disabled={isUploading}
          className="rounded-none"
          size="sm"
        >
          Save Identity
        </Button>
      </section>

      {/* Logo Upload */}
      <section className="border border-border p-6 mb-8">
        <h2 className="text-base font-medium mb-1">Logo</h2>
        <p className="text-xs text-muted-foreground mb-4">Displayed in the header and footer. Recommended: transparent PNG, max 2MB.</p>

        {branding.logo_url ? (
          <div className="flex items-center gap-4">
            <div className="border border-border p-3 bg-muted/30">
              <img src={branding.logo_url} alt="Logo" className="h-12 object-contain" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-none" onClick={() => logoRef.current?.click()} disabled={isUploading}>
                Change
              </Button>
              <Button size="sm" variant="outline" className="rounded-none text-destructive" onClick={() => handleRemoveImage("logo_url")} disabled={isUploading}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => logoRef.current?.click()}
            disabled={isUploading}
            className="border-2 border-dashed border-border p-8 w-full flex flex-col items-center gap-2 text-muted-foreground hover:border-foreground/40"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Upload Logo</span>
          </button>
        )}
        <input
          ref={logoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "logo", "logo_url");
            e.target.value = "";
          }}
        />
      </section>

      {/* Hero Banner */}
      <section className="border border-border p-6 mb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-medium">Hero Banner</h2>
          <Button
            size="sm"
            variant={branding.hero_enabled ? "default" : "outline"}
            className="rounded-none text-xs"
            onClick={handleToggleHero}
            disabled={isUploading}
          >
            {branding.hero_enabled ? "Enabled" : "Disabled"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Upload separate banners for desktop and mobile views. Max 2MB each.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Desktop Banner */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Desktop Banner</span>
            </div>
            {branding.desktop_hero_url ? (
              <div className="space-y-2">
                <div className="border border-border overflow-hidden bg-muted/30">
                  <img src={branding.desktop_hero_url} alt="Desktop hero" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-none text-xs" onClick={() => desktopHeroRef.current?.click()} disabled={isUploading}>
                    Change
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none text-xs text-destructive" onClick={() => handleRemoveImage("desktop_hero_url")} disabled={isUploading}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => desktopHeroRef.current?.click()}
                disabled={isUploading}
                className="border-2 border-dashed border-border p-8 w-full flex flex-col items-center gap-2 text-muted-foreground hover:border-foreground/40"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Upload Desktop Banner</span>
              </button>
            )}
            <input
              ref={desktopHeroRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, "hero-desktop", "desktop_hero_url");
                e.target.value = "";
              }}
            />
          </div>

          {/* Mobile Banner */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Mobile Banner</span>
            </div>
            {branding.mobile_hero_url ? (
              <div className="space-y-2">
                <div className="border border-border overflow-hidden max-h-[200px] bg-muted/30">
                  <img src={branding.mobile_hero_url} alt="Mobile hero" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-none text-xs" onClick={() => mobileHeroRef.current?.click()} disabled={isUploading}>
                    Change
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-none text-xs text-destructive" onClick={() => handleRemoveImage("mobile_hero_url")} disabled={isUploading}>
                    <X className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => mobileHeroRef.current?.click()}
                disabled={isUploading}
                className="border-2 border-dashed border-border p-8 w-full flex flex-col items-center gap-2 text-muted-foreground hover:border-foreground/40"
              >
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">Upload Mobile Banner</span>
              </button>
            )}
            <input
              ref={mobileHeroRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file, "hero-mobile", "mobile_hero_url");
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Tracking & Marketing ───────────────────────────── */}
      <section className="border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-medium">Tracking & Marketing</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">Configure Facebook Pixel for conversion tracking across your store.</p>

        {loadingPixel ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        ) : !pixelSettings ? (
          <p className="text-sm text-muted-foreground">No settings row found. Please contact support.</p>
        ) : (
          <div className="space-y-5">
            {/* Pixel ID */}
            <div>
              <Label className="text-sm">Facebook Pixel ID</Label>
              <Input
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                className="mt-1 rounded-none max-w-sm font-mono"
                placeholder="e.g. 123456789012345"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Enable Pixel</p>
                  <p className="text-xs text-muted-foreground">Activate tracking on your storefront</p>
                </div>
                <Switch checked={pixelEnabled} onCheckedChange={setPixelEnabled} />
              </div>

              <div className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Test Mode</p>
                  <p className="text-xs text-muted-foreground">Log events to console for debugging</p>
                </div>
                <Switch checked={testMode} onCheckedChange={setTestMode} />
              </div>

              <div className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Advanced Matching</p>
                  <p className="text-xs text-muted-foreground">Send hashed user data for better attribution</p>
                </div>
                <Switch checked={advancedMatching} onCheckedChange={setAdvancedMatching} />
              </div>

              <div className="flex items-center justify-between border border-border p-3">
                <div>
                  <p className="text-sm font-medium">E-Commerce Events</p>
                  <p className="text-xs text-muted-foreground">ViewContent, AddToCart, Purchase, etc.</p>
                </div>
                <Switch checked={ecommerceEvents} onCheckedChange={setEcommerceEvents} />
              </div>
            </div>

            <Button
              onClick={handleSavePixel}
              disabled={updatePixelMutation.isPending}
              className="rounded-none"
              size="sm"
            >
              {updatePixelMutation.isPending ? "Saving…" : "Save Pixel Settings"}
            </Button>
          </div>
        )}
      </section>

      {/* ── Gemini AI Credentials ───────────────────────────── */}
      <section className="border border-border p-6 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-medium">Gemini AI Credentials</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          Powers the Admin AI Assistant, AI search suggestions, and AI product description generator.
          Lovable AI Gateway is used by default. Optionally provide your own Google Gemini API key for direct access.
        </p>

        {loadingGemini ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <div className="space-y-4">
            {/* Lovable AI status */}
            <div className="flex items-center justify-between border border-border p-3">
              <div className="flex items-center gap-3">
                {geminiStatus?.lovable_ai_configured ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium">Lovable AI Gateway</p>
                  <p className="text-xs text-muted-foreground">
                    Built-in Gemini access — no setup required
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {geminiStatus?.lovable_ai_configured ? "Active" : "Unavailable"}
              </span>
            </div>

            {/* Custom Gemini Key status */}
            <div className="flex items-center justify-between border border-border p-3">
              <div className="flex items-center gap-3">
                {geminiStatus?.gemini_configured ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">Custom Gemini API Key</p>
                  <p className="text-xs text-muted-foreground">
                    {geminiStatus?.gemini_configured
                      ? `Configured: ${geminiStatus.gemini_masked}`
                      : "Not configured — using Lovable AI Gateway"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {geminiStatus?.gemini_configured ? "Set" : "—"}
              </span>
            </div>

            {/* Active provider */}
            <div className="bg-muted/30 border border-border p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Active provider: </span>
                {geminiStatus?.active_provider === "gemini_direct"
                  ? "Custom Gemini API Key (direct)"
                  : geminiStatus?.active_provider === "lovable_gateway"
                  ? "Lovable AI Gateway (default)"
                  : "None — AI features disabled"}
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
              <p className="font-medium text-foreground">To add or update your Google Gemini API Key:</p>
              <p>1. Get a key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" className="underline">aistudio.google.com/app/apikey</a></p>
              <p>2. Ask the AI assistant: <span className="font-mono bg-muted px-1">"Update GEMINI_API_KEY secret"</span></p>
              <p>3. Paste the key in the secure form. It will be available immediately.</p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="rounded-none"
              onClick={() => refetchGemini()}
            >
              Refresh Status
            </Button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSiteSettings;
