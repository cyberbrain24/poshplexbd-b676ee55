import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { FONT_CATALOG, findFont } from "@/lib/fontCatalog";
import {
  TYPO_TOKENS,
  TYPO_DEFAULT_SETTINGS,
  TOKEN_LABELS,
  TOKEN_LOCATIONS,
  TOKEN_GROUPS,
  normalizeTypographySettings,
  type TokenConfig,
  type TypographySettings,
  type TypographyToken,
  type FamilySlot,
  type TextTransform,
} from "@/lib/typographyTokens";

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];
const TRANSFORMS: TextTransform[] = ["none", "uppercase", "lowercase", "capitalize"];

const TypographySettingsPanel = () => {
  const qc = useQueryClient();
  const [settings, setSettings] = useState<TypographySettings>(() => JSON.parse(JSON.stringify(TYPO_DEFAULT_SETTINGS)));
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
    if (!data) return;
    setSettings(normalizeTypographySettings(data.typography));
  }, [data]);

  // Preview fonts are self-hosted via public/fonts/google/fonts.css — no external CDN loading.

  const updateFamily = (slot: FamilySlot, value: string) => {
    setSettings((s) => ({ ...s, families: { ...s.families, [slot]: value } }));
  };

  const updateToken = (t: TypographyToken, patch: Partial<TokenConfig>) => {
    setSettings((s) => ({ ...s, tokens: { ...s.tokens, [t]: { ...s.tokens[t], ...patch } } }));
  };

  const handleSave = async () => {
    if (!data?.id) {
      toast.error("Site settings row not found");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ typography: settings as any })
      .eq("id", data.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    toast.success("Typography saved and applied");
    qc.invalidateQueries({ queryKey: ["site-typography"] });
    qc.invalidateQueries({ queryKey: ["site-typography-admin"] });
  };

  const handleReset = () => {
    setSettings(JSON.parse(JSON.stringify(TYPO_DEFAULT_SETTINGS)));
    toast.info("Reset to spec defaults — click Save to apply");
  };

  const grouped = useMemo(
    () => ({
      local: FONT_CATALOG.filter((f) => f.category === "local"),
      serif: FONT_CATALOG.filter((f) => f.category === "serif"),
      display: FONT_CATALOG.filter((f) => f.category === "display"),
      sans: FONT_CATALOG.filter((f) => f.category === "sans"),
      mono: FONT_CATALOG.filter((f) => f.category === "mono"),
    }),
    [],
  );

  const FontSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectGroup>
          <SelectLabel>Serif (editorial)</SelectLabel>
          {grouped.serif.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Sans-serif</SelectLabel>
          {grouped.sans.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Display</SelectLabel>
          {grouped.display.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Monospace</SelectLabel>
          {grouped.mono.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Local (bundled)</SelectLabel>
          {grouped.local.map((f) => <SelectItem key={f.name} value={f.name}>{f.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading typography…</div>;
  }

  const previewStack = (slot: FamilySlot) =>
    `'${settings.families[slot]}', ${slot === "serif" ? "Georgia, serif" : "Helvetica Neue, Arial, sans-serif"}`;

  const renderToken = (t: TypographyToken) => {
    const c = settings.tokens[t];
    const stack = previewStack(c.slot);
    return (
      <div key={t} className="border border-border p-4 grid gap-3 md:grid-cols-[200px_1fr_1fr]">
        <div>
          <div className="text-sm font-semibold">{TOKEN_LABELS[t]}</div>
          <div className="text-xs text-muted-foreground mt-1">{TOKEN_LOCATIONS[t]}</div>
          <code className="text-[10px] text-muted-foreground block mt-2">.t-{t}</code>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Family slot</Label>
            <Select value={c.slot} onValueChange={(v: FamilySlot) => updateToken(t, { slot: v })}>
              <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="serif">Serif ({settings.families.serif})</SelectItem>
                <SelectItem value="sans">Sans ({settings.families.sans})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Transform</Label>
            <Select value={c.transform} onValueChange={(v: TextTransform) => updateToken(t, { transform: v })}>
              <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSFORMS.map((tr) => <SelectItem key={tr} value={tr}>{tr}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Size desktop (px)</Label>
            <Input
              type="number" min={8} max={120} className="rounded-none h-9"
              value={c.sizeDesktop}
              onChange={(e) => updateToken(t, { sizeDesktop: Number(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label className="text-xs">Size mobile (px)</Label>
            <Input
              type="number" min={8} max={120} className="rounded-none h-9"
              value={c.sizeMobile}
              onChange={(e) => updateToken(t, { sizeMobile: Number(e.target.value) || 0 })}
            />
          </div>

          <div>
            <Label className="text-xs">Weight desktop</Label>
            <Select value={String(c.weightDesktop)} onValueChange={(v) => updateToken(t, { weightDesktop: Number(v) })}>
              <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEIGHTS.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Weight mobile</Label>
            <Select value={String(c.weightMobile)} onValueChange={(v) => updateToken(t, { weightMobile: Number(v) })}>
              <SelectTrigger className="rounded-none h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEIGHTS.map((w) => <SelectItem key={w} value={String(w)}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Line height</Label>
            <Input
              type="number" min={0.8} max={2.5} step={0.05} className="rounded-none h-9"
              value={c.lineHeight}
              onChange={(e) => updateToken(t, { lineHeight: Number(e.target.value) || 1 })}
            />
          </div>

          <div>
            <Label className="text-xs">Letter spacing (px)</Label>
            <Input
              type="number" min={-5} max={10} step={0.1} className="rounded-none h-9"
              value={c.letterSpacing}
              onChange={(e) => updateToken(t, { letterSpacing: Number(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="border border-dashed border-border p-3 min-h-[80px] flex items-center bg-background overflow-hidden">
          <span
            style={{
              fontFamily: stack,
              fontWeight: c.weightDesktop,
              fontSize: `${Math.min(c.sizeDesktop, 36)}px`,
              lineHeight: c.lineHeight,
              letterSpacing: `${c.letterSpacing}px`,
              textTransform: c.transform,
            }}
          >
            The quick brown fox
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Typography</h2>
          <p className="text-sm text-muted-foreground">
            17-token system based on the brand typography spec. Two font slots (Serif &amp; Sans),
            each token references one slot. Changes apply instantly storefront-wide after saving.
            Admin panel is unaffected.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={handleReset}>
            Reset to spec defaults
          </Button>
          <Button size="sm" className="rounded-none" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save & Apply"}
          </Button>
        </div>
      </div>

      {/* Family slots */}
      <div className="border border-border p-4 space-y-4">
        <div className="text-sm font-semibold">Font families</div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Serif slot — editorial / display</Label>
            <FontSelect value={settings.families.serif} onChange={(v) => updateFamily("serif", v)} />
            <div className="border border-dashed border-border p-3 bg-background">
              <div style={{ fontFamily: previewStack("serif"), fontSize: 28, lineHeight: 1.1 }}>
                Editorial Headlines
              </div>
              <div style={{ fontFamily: previewStack("serif"), fontSize: 14, marginTop: 6 }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Sans slot — UI / functional</Label>
            <FontSelect value={settings.families.sans} onChange={(v) => updateFamily("sans", v)} />
            <div className="border border-dashed border-border p-3 bg-background">
              <div style={{ fontFamily: previewStack("sans"), fontSize: 18, fontWeight: 500 }}>
                Buttons · Prices · Body
              </div>
              <div style={{ fontFamily: previewStack("sans"), fontSize: 14, marginTop: 6 }}>
                The quick brown fox jumps over the lazy dog
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Token groups */}
      {TOKEN_GROUPS.map((g) => (
        <div key={g.label} className="space-y-3">
          <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</div>
          <div className="grid gap-3">
            {g.tokens.map(renderToken)}
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="rounded-none" onClick={handleReset}>
          Reset to spec defaults
        </Button>
        <Button size="sm" className="rounded-none" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save & Apply"}
        </Button>
      </div>
    </section>
  );
};

export default TypographySettingsPanel;
