import { useState, useRef } from "react";
import { useSiteBranding, useUpdateSiteBranding, useUploadBrandingAsset } from "@/hooks/useSiteBranding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, X, Image as ImageIcon, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const AdminSiteSettings = () => {
  const { data: branding, isLoading } = useSiteBranding();
  const updateMutation = useUpdateSiteBranding();
  const uploadMutation = useUploadBrandingAsset();

  const [siteName, setSiteName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [initialized, setInitialized] = useState(false);

  const logoRef = useRef<HTMLInputElement>(null);
  const desktopHeroRef = useRef<HTMLInputElement>(null);
  const mobileHeroRef = useRef<HTMLInputElement>(null);

  // Initialize form when data loads
  if (branding && !initialized) {
    setSiteName(branding.site_name);
    setSlogan(branding.slogan);
    setInitialized(true);
  }

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
    </div>
  );
};

export default AdminSiteSettings;
