import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

type Settings = {
  id?: string;
  provider_name: string; endpoint_url: string; http_method: string;
  request_template: any; headers: any;
  api_key: string; business_phone_id: string; sender_display_name: string;
  default_language: string; success_keyword: string; enabled: boolean; notes: string;
};
type Template = {
  id: string; event_key: string; name: string; language: string; category: string;
  header_type: string; media_url: string; body: string; variables: any;
  enabled: boolean; is_system: boolean;
};

export default function AdminWhatsAppMarketing() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [suppression, setSuppression] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk form
  const [bulkName, setBulkName] = useState("");
  const [bulkBody, setBulkBody] = useState("Hi {name}, new drop just landed at POSHPLEX. Shop now: https://poshplexbd.com");
  const [bulkMedia, setBulkMedia] = useState("");
  const [audType, setAudType] = useState<"all" | "membership" | "division" | "manual">("all");
  const [audIds, setAudIds] = useState<string[]>([]);
  const [audPhones, setAudPhones] = useState("");
  const [sending, setSending] = useState(false);

  // Opt-out form
  const [optoutPhone, setOptoutPhone] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }, { data: c }, { data: m }, { data: sup }, { data: mt }, { data: dv }] = await Promise.all([
      supabase.from("wa_provider_settings").select("*").maybeSingle(),
      supabase.from("wa_templates").select("*").order("event_key"),
      supabase.from("wa_campaigns").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("wa_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("wa_suppression").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("customer_types").select("id, name").eq("is_active", true),
      supabase.from("divisions").select("id, name").eq("is_active", true),
    ]);
    setSettings(s as any);
    setTemplates((t as any) || []);
    setCampaigns(c || []);
    setMessages(m || []);
    setSuppression(sup || []);
    setMemberships(mt || []);
    setDivisions(dv || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    let req = settings.request_template;
    let hdr = settings.headers;
    try { if (typeof req === "string") req = JSON.parse(req); } catch { toast.error("Request template must be valid JSON"); return; }
    try { if (typeof hdr === "string") hdr = JSON.parse(hdr); } catch { toast.error("Headers must be valid JSON"); return; }
    const { error } = await supabase.from("wa_provider_settings").update({
      ...settings, request_template: req, headers: hdr,
    }).eq("id", settings.id!);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const saveTemplate = async (tpl: Template) => {
    const { error } = await supabase.from("wa_templates").update({
      name: tpl.name, body: tpl.body, language: tpl.language,
      header_type: tpl.header_type, media_url: tpl.media_url, enabled: tpl.enabled,
    }).eq("id", tpl.id);
    if (error) toast.error(error.message); else toast.success("Template saved");
  };

  const sendBulk = async () => {
    if (!bulkBody.trim()) { toast.error("Message body required"); return; }
    setSending(true);
    const audience_filter: any = { type: audType };
    if (audType === "membership" || audType === "division") audience_filter.ids = audIds;
    if (audType === "manual") audience_filter.phones = audPhones.split(/[\s,]+/).filter(Boolean);
    const { data, error } = await supabase.functions.invoke("whatsapp-marketing-send", {
      body: { action: "bulk", name: bulkName, body: bulkBody, media_url: bulkMedia, audience_filter },
    });
    setSending(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    toast.success(`Sent: ${(data as any).sent} / Failed: ${(data as any).failed}`);
    setBulkName(""); setAudPhones(""); setAudIds([]);
    load();
  };

  const addSuppression = async () => {
    const phone = optoutPhone.replace(/[^\d+]/g, "");
    if (!phone) return;
    const { error } = await supabase.from("wa_suppression").insert({ phone, reason: "manual", source: "admin" });
    if (error) toast.error(error.message); else { toast.success("Added"); setOptoutPhone(""); load(); }
  };

  const removeSuppression = async (id: string) => {
    const { error } = await supabase.from("wa_suppression").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  if (loading || !settings) return <div className="p-6"><Loader2 className="animate-spin h-5 w-5" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-1">WhatsApp Marketing</h1>
      <p className="text-sm text-muted-foreground mb-4">Bulk WhatsApp campaigns, fashion-commerce templates, provider settings, history and opt-outs. Lightweight & isolated.</p>

      <Tabs defaultValue="bulk">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bulk">Bulk Send</TabsTrigger>
          <TabsTrigger value="templates">Auto Triggers</TabsTrigger>
          <TabsTrigger value="settings">Provider Settings</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="optouts">Opt-outs</TabsTrigger>
        </TabsList>

        {/* BULK */}
        <TabsContent value="bulk" className="space-y-3 mt-4">
          <div className="border p-4 rounded-md space-y-3">
            <Input placeholder="Campaign name (optional)" value={bulkName} onChange={e => setBulkName(e.target.value)} />
            <Textarea rows={5} placeholder="Message body — use {name} for personalisation" value={bulkBody} onChange={e => setBulkBody(e.target.value)} />
            <Input placeholder="Optional media URL (image / video / document)" value={bulkMedia} onChange={e => setBulkMedia(e.target.value)} />

            <div>
              <Label className="text-xs mb-1 block">WhatsApp preview</Label>
              <div className="bg-[#e5ddd5] p-3 rounded">
                <div className="bg-white max-w-sm rounded-lg p-3 shadow text-sm whitespace-pre-wrap">
                  {bulkMedia && <div className="mb-2 text-xs text-muted-foreground border rounded p-2 break-all">📎 {bulkMedia}</div>}
                  {bulkBody.replace(/\{name\}/g, "Sadia")}
                  <div className="text-[10px] text-right text-muted-foreground mt-1">12:34</div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={audType} onValueChange={(v: any) => { setAudType(v); setAudIds([]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All active customers (with phone)</SelectItem>
                    <SelectItem value="membership">By membership type</SelectItem>
                    <SelectItem value="division">By district</SelectItem>
                    <SelectItem value="manual">Manual phone list</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audType === "membership" && (
                <div className="space-y-1 max-h-40 overflow-auto border p-2 rounded">
                  {memberships.map(m => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={audIds.includes(m.id)} onChange={e => setAudIds(p => e.target.checked ? [...p, m.id] : p.filter(x => x !== m.id))} />
                      {m.name}
                    </label>
                  ))}
                </div>
              )}
              {audType === "division" && (
                <div className="space-y-1 max-h-40 overflow-auto border p-2 rounded">
                  {divisions.map(d => (
                    <label key={d.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={audIds.includes(d.id)} onChange={e => setAudIds(p => e.target.checked ? [...p, d.id] : p.filter(x => x !== d.id))} />
                      {d.name}
                    </label>
                  ))}
                </div>
              )}
              {audType === "manual" && (
                <Textarea rows={4} placeholder="Phone numbers with country code (comma or newline separated)" value={audPhones} onChange={e => setAudPhones(e.target.value)} />
              )}
            </div>
            <Button onClick={sendBulk} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send WhatsApp Campaign
            </Button>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-3 mt-4">
          <div className="text-xs text-muted-foreground border-l-2 border-amber-400 bg-amber-50 p-2 rounded">
            Templates are stored and ready. Auto-firing on app events (order placed, cart abandoned, etc.) is a future step — this v1 keeps the existing system untouched.
          </div>
          {templates.map((tpl, i) => (
            <div key={tpl.id} className="border p-4 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tpl.name} <span className="text-xs text-muted-foreground">({tpl.event_key} · {tpl.category})</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={tpl.enabled} onCheckedChange={v => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, enabled: v } : t))} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-2">
                <Input placeholder="Template name" value={tpl.name} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, name: e.target.value } : t))} />
                <Input placeholder="Language (en, bn…)" value={tpl.language} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, language: e.target.value } : t))} />
                <Input placeholder="Media URL (optional)" value={tpl.media_url} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, media_url: e.target.value } : t))} />
              </div>
              <Textarea rows={3} value={tpl.body} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, body: e.target.value } : t))} />
              <p className="text-xs text-muted-foreground">Variables: {Array.isArray(tpl.variables) ? tpl.variables.join(", ") : ""}</p>
              <Button size="sm" onClick={() => saveTemplate(tpl)}>Save</Button>
            </div>
          ))}
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-3 mt-4">
          <div className="border p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <Label>Enabled</Label>
              <Switch checked={settings.enabled} onCheckedChange={v => setSettings(s => ({ ...s!, enabled: v }))} />
            </div>
            <Input placeholder="Provider name (Meta Cloud, 360dialog, Gupshup, WATI…)" value={settings.provider_name || ""} onChange={e => setSettings(s => ({ ...s!, provider_name: e.target.value }))} />
            <Input placeholder="Endpoint URL (supports {api_key} {business_phone_id} {to} {body} {media_url})" value={settings.endpoint_url || ""} onChange={e => setSettings(s => ({ ...s!, endpoint_url: e.target.value }))} />
            <Select value={settings.http_method} onValueChange={v => setSettings(s => ({ ...s!, http_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="API key / access token" value={settings.api_key || ""} onChange={e => setSettings(s => ({ ...s!, api_key: e.target.value }))} />
            <Input placeholder="Business Phone Number ID" value={settings.business_phone_id || ""} onChange={e => setSettings(s => ({ ...s!, business_phone_id: e.target.value }))} />
            <Input placeholder="Sender display name" value={settings.sender_display_name || ""} onChange={e => setSettings(s => ({ ...s!, sender_display_name: e.target.value }))} />
            <Input placeholder="Default language (en, bn…)" value={settings.default_language || ""} onChange={e => setSettings(s => ({ ...s!, default_language: e.target.value }))} />
            <Input placeholder="Success keyword (optional — e.g. 'messages')" value={settings.success_keyword || ""} onChange={e => setSettings(s => ({ ...s!, success_keyword: e.target.value }))} />
            <div>
              <Label className="text-xs">Headers (JSON)</Label>
              <Textarea rows={3} className="font-mono text-xs" value={typeof settings.headers === "string" ? settings.headers : JSON.stringify(settings.headers, null, 2)}
                onChange={e => setSettings(s => ({ ...s!, headers: e.target.value as any }))} />
            </div>
            <div>
              <Label className="text-xs">Request body template (JSON, with placeholders)</Label>
              <Textarea rows={6} className="font-mono text-xs" value={typeof settings.request_template === "string" ? settings.request_template : JSON.stringify(settings.request_template, null, 2)}
                onChange={e => setSettings(s => ({ ...s!, request_template: e.target.value as any }))} />
            </div>
            <Button onClick={saveSettings}>Save Settings</Button>
          </div>
        </TabsContent>

        {/* CAMPAIGNS */}
        <TabsContent value="campaigns" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">Name</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.name}</td>
                    <td className="text-center">{c.recipient_count}</td>
                    <td className="text-center text-green-600">{c.sent_count}</td>
                    <td className="text-center text-red-600">{c.failed_count}</td>
                    <td className="text-center">{c.status}</td>
                    <td className="text-xs">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!campaigns.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No campaigns yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">To</th><th className="text-left">Message</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{m.to_phone}</td>
                    <td className="text-xs max-w-md truncate">{m.body}</td>
                    <td className="text-center"><span className={m.status === "sent" ? "text-green-600" : m.status === "suppressed" ? "text-amber-600" : "text-red-600"}>{m.status}</span></td>
                    <td className="text-xs">{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!messages.length && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No messages sent yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* OPT-OUTS */}
        <TabsContent value="optouts" className="mt-4 space-y-3">
          <div className="border p-3 rounded-md flex gap-2">
            <Input placeholder="Add phone to opt-out list" value={optoutPhone} onChange={e => setOptoutPhone(e.target.value)} />
            <Button onClick={addSuppression}>Add</Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">Phone</th><th>Reason</th><th>Source</th><th>When</th><th></th></tr></thead>
              <tbody>
                {suppression.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{s.phone}</td>
                    <td className="text-center text-xs">{s.reason}</td>
                    <td className="text-center text-xs">{s.source}</td>
                    <td className="text-xs">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="text-right pr-2">
                      <Button size="sm" variant="ghost" onClick={() => removeSuppression(s.id)}>Remove</Button>
                    </td>
                  </tr>
                ))}
                {!suppression.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No opt-outs.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
