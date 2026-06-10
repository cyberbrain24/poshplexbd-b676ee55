import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, CheckCircle2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

type ProviderStatus = { configured: boolean; enabled: boolean; masked: string | null; source: string | null };
type ProviderKey = "gemini" | "openai" | "anthropic" | "openrouter";
type AICredsStatus = {
  active_provider: string;
  providers: Record<ProviderKey, ProviderStatus>;
};

const PROVIDER_CONFIG = {
  gemini: {
    label: "Google Gemini",
    keyColumn: "gemini_api_key" as const,
    enabledColumn: "gemini_enabled" as const,
    placeholder: "AIza...",
    helpUrl: "https://aistudio.google.com/app/apikey",
    helpLabel: "aistudio.google.com/app/apikey",
  },
  openai: {
    label: "OpenAI (ChatGPT)",
    keyColumn: "openai_api_key" as const,
    enabledColumn: "openai_enabled" as const,
    placeholder: "sk-...",
    helpUrl: "https://platform.openai.com/api-keys",
    helpLabel: "platform.openai.com/api-keys",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    keyColumn: "anthropic_api_key" as const,
    enabledColumn: "anthropic_enabled" as const,
    placeholder: "sk-ant-...",
    helpUrl: "https://console.anthropic.com/settings/keys",
    helpLabel: "console.anthropic.com/settings/keys",
  },
  openrouter: {
    label: "OpenRouter (Multi-model)",
    keyColumn: "openrouter_api_key" as const,
    enabledColumn: "openrouter_enabled" as const,
    placeholder: "sk-or-...",
    helpUrl: "https://openrouter.ai/keys",
    helpLabel: "openrouter.ai/keys",
  },
} as const;

const AIProviderCredentialsPanel = () => {
  const { data: aiStatus, isLoading, refetch } = useQuery({
    queryKey: ["ai-credentials-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("gemini-credentials-status");
      if (error) throw error;
      return data as AICredsStatus;
    },
  });

  const [keyInputs, setKeyInputs] = useState<Record<ProviderKey, string>>({
    gemini: "", openai: "", anthropic: "", openrouter: "",
  });
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const handleSaveKey = async (provider: ProviderKey) => {
    const cfg = PROVIDER_CONFIG[provider];
    const key = keyInputs[provider].trim();
    if (!key) { toast.error(`Please enter a ${cfg.label} API key`); return; }
    if (key.length < 20) { toast.error("That doesn't look like a valid API key"); return; }
    setSavingProvider(provider);
    const { data: row } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    if (!row) { toast.error("Site settings row not found"); setSavingProvider(null); return; }
    const { error } = await supabase.from("site_settings").update({ [cfg.keyColumn]: key }).eq("id", row.id);
    setSavingProvider(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${cfg.label} API key saved`);
    setKeyInputs((s) => ({ ...s, [provider]: "" }));
    refetch();
  };

  const handleClearKey = async (provider: ProviderKey) => {
    const cfg = PROVIDER_CONFIG[provider];
    if (!confirm(`Remove the saved ${cfg.label} API key?`)) return;
    setSavingProvider(provider);
    const { data: row } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    if (!row) { setSavingProvider(null); return; }
    const { error } = await supabase.from("site_settings").update({ [cfg.keyColumn]: null }).eq("id", row.id);
    setSavingProvider(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${cfg.label} API key removed`);
    refetch();
  };

  const handleToggle = async (provider: ProviderKey, next: boolean) => {
    const cfg = PROVIDER_CONFIG[provider];
    const { data: row } = await supabase.from("site_settings").select("id").limit(1).maybeSingle();
    if (!row) { toast.error("Site settings row not found"); return; }
    const { error } = await supabase.from("site_settings").update({ [cfg.enabledColumn]: next }).eq("id", row.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`${cfg.label} ${next ? "enabled" : "disabled"}`);
    refetch();
  };

  return (
    <section className="border border-border p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-medium">AI Provider Credentials</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Configure one or more third-party AI providers (Gemini, OpenAI/ChatGPT, Anthropic/Claude, OpenRouter).
        Powers the Admin AI Assistant, AI search suggestions, and product description generator.
      </p>
      <p className="text-xs text-muted-foreground mb-6">
        Active provider:{" "}
        <span className="font-mono">
          {aiStatus?.active_provider && aiStatus.active_provider !== "none"
            ? aiStatus.active_provider
            : "none configured"}
        </span>
        . The system picks based on the selected model; if that provider has no key, it falls back to the next enabled provider in order: Gemini → OpenAI → Anthropic → OpenRouter.
      </p>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="space-y-6">
          {(["gemini", "openai", "anthropic", "openrouter"] as const).map((provider) => {
            const cfg = PROVIDER_CONFIG[provider];
            const status = aiStatus?.providers?.[provider];
            return (
              <div key={provider} className="border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {status?.configured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {status?.configured
                          ? `Configured: ${status.masked} (${status.source})`
                          : "No API key configured"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">
                      {!status?.enabled ? "Disabled" : status?.configured ? "Active" : "—"}
                    </span>
                    <Switch
                      checked={!!status?.enabled}
                      onCheckedChange={(next) => handleToggle(provider, next)}
                    />
                  </div>
                </div>

                <Label className="text-sm font-medium">
                  {status?.configured ? `Update ${cfg.label} API Key` : `Set ${cfg.label} API Key`}
                </Label>
                <Input
                  type="password"
                  value={keyInputs[provider]}
                  onChange={(e) => setKeyInputs((s) => ({ ...s, [provider]: e.target.value }))}
                  className="rounded-none font-mono"
                  placeholder={cfg.placeholder}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Get a key at{" "}
                  <a href={cfg.helpUrl} target="_blank" rel="noopener" className="underline">
                    {cfg.helpLabel}
                  </a>
                  . Stored securely; only admins can view or change it.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-none"
                    onClick={() => handleSaveKey(provider)}
                    disabled={savingProvider === provider || !keyInputs[provider].trim()}
                  >
                    {savingProvider === provider ? "Saving…" : "Save Key"}
                  </Button>
                  {status?.configured && status?.source === "database" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-none text-destructive"
                      onClick={() => handleClearKey(provider)}
                      disabled={savingProvider === provider}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove Key
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <Button size="sm" variant="outline" className="rounded-none" onClick={() => refetch()}>
              Refresh Status
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AIProviderCredentialsPanel;
