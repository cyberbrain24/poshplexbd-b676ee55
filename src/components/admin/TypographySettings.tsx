import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FONT_CATALOG,
  TYPOGRAPHY_DEFAULTS,
  TARGET_LABELS,
  TRACKING_MAP,
  findFont,
  type ElementConfig,
  type TypographyConfig,
  type TypographyTarget,
} from "@/lib/fontCatalog";

const TARGETS: TypographyTarget[] = ["h1", "h2", "h3", "h4", "h5", "body", "nav"];
const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

const TypographySettings = () => {
  const qc = useQueryClient();
  const [config, setConfig] = useState<Record<TypographyTarget, ElementConfig>>({ ...TYPOGRAPHY_DEFAULTS });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["site-typography-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, typography")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data?.typography) return;
    const stored = data.typography as TypographyConfig;
    setConfig({
      h1:   { ...TYPOGRAPHY_DEFAULTS.h1,   ...(stored.h1   || {}) },
      h2:   { ...TYPOGRAPHY_DEFAULTS.h2,   ...(stored.h2   || {}) },
      h3:   { ...TYPOGRAPHY_DEFAULTS.h3,   ...(stored.h3   || {}) },
      h4:   { ...TYPOGRAPHY_DEFAULTS.h4,   ...(stored.h4   || {}) },
      h5:   { ...TYPOGRAPHY_DEFAULTS.h5,   ...(stored.h5   || {}) },
      body: { ...TYPOGRAPHY_DEFAULTS.body, ...(stored.body || {}) },
      nav:  { ...TYPOGRAPHY_DEFAULTS.nav,  ...(stored.nav  || {}) },
    });
  }, [data]);

  const updateTarget = (t: TypographyTarget, patch: Partial<ElementConfig>) => {
    setConfig((c) => ({ ...c, [t]: { ...c[t], ...patch } }));
  };

  const handleSave = async () => {
    if (!data?.id) {
      toast.error("Site settings row not found");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ typography: config as any })
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save typography: " + error.message);
      return;
    }
    toast.success("Typography saved and applied");
    qc.invalidateQueries({ queryKey: ["site-typography"] });
    qc.invalidateQueries({ queryKey: ["site-typography-admin"] });
  };

  const handleReset = () => {
    setConfig({ ...TYPOGRAPHY_DEFAULTS });
    toast.info("Reset to defaults — click Save to apply");
  };

  // Lazy-load preview fonts as user picks them
  useEffect(() => {
    Object.values(config).forEach((c) => {
      const f = findFont(c.family);
      if (f?.googleParam) {
        const id = "preview-font-" + f.googleParam;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${f.googleParam}&display=swap`;
          document.head.appendChild(link);
        }
      }
    });
  }, [config]);

  const grouped = {
    local: FONT_CATALOG.filter((f) => f.category === "local"),
    display: FONT_CATALOG.filter((f) => f.category === "display"),
    sans: FONT_CATALOG.filter((f) => f.category === "sans"),
    mono: FONT_CATALOG.filter((f) => f.category === "mono"),
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading typography…</div>;
  }

  return (
    <section className="space-y-4 border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Typography</h2>
          <p className="text-sm text-muted-foreground">
            Choose fonts, weights, sizes, and casing for each text element on the storefront.
            Changes apply instantly after saving. The admin panel is unaffected.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={handleReset}>
            Reset to defaults
          </Button>
          <Button size="sm" className="rounded-none" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Apply"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {TARGETS.map((t) => {
          const c = config[t];
          const font = findFont(c.family);
          const previewStyle: React.CSSProperties = {
            fontFamily: `'${c.family}', ${font?.category === "mono" ? "monospace" : "sans-serif"}`,
            fontWeight: c.weight,
            letterSpacing: TRACKING_MAP[c.tracking],
            textTransform: c.uppercase ? "uppercase" : "none",
            fontSize: `${Math.round(20 * c.scale)}px`,
            lineHeight: 1.2,
          };

          return (
            <div key={t} className="border border-border p-4 grid gap-3 md:grid-cols-[180px_1fr_1fr]">
              <div>
                <div className="text-sm font-semibold">{TARGET_LABELS[t]}</div>
                <div className="text-xs text-muted-foreground mt-1">Live preview →</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font family</Label>
                  <Select value={c.family} onValueChange={(v) => updateTarget(t, { family: v })}>
                    <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectGroup>
                        <SelectLabel>Local (bundled)</SelectLabel>
                        {grouped.local.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Display</SelectLabel>
                        {grouped.display.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Sans-serif</SelectLabel>
                        {grouped.sans.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Monospace</SelectLabel>
                        {grouped.mono.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Weight</Label>
                  <Select value={String(c.weight)} onValueChange={(v) => updateTarget(t, { weight: Number(v) })}>
                    <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEIGHTS.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Letter spacing</Label>
                  <Select value={c.tracking} onValueChange={(v: any) => updateTarget(t, { tracking: v })}>
                    <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Size scale ({c.scale.toFixed(2)}×)</Label>
                  <Slider
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={[c.scale]}
                    onValueChange={(v) => updateTarget(t, { scale: v[0] })}
                    className="mt-3"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={c.uppercase}
                    onCheckedChange={(v) => updateTarget(t, { uppercase: v })}
                    id={`uppercase-${t}`}
                  />
                  <Label htmlFor={`uppercase-${t}`} className="text-xs cursor-pointer">UPPERCASE</Label>
                </div>
              </div>

              <div className="border border-dashed border-border p-3 min-h-[80px] flex items-center bg-background">
                <span style={previewStyle}>The quick brown fox</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TypographySettings;
