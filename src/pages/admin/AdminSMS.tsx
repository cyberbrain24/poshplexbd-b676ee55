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
  api_key: string; sender_id: string;
  success_keyword: string; enabled: boolean; notes: string;
};
type Template = { id: string; event_key: string; name: string; body: string; enabled: boolean; is_system: boolean };

export default function AdminSMS() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk form
  const [bulkName, setBulkName] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [audType, setAudType] = useState<"all" | "membership" | "division" | "manual">("all");
  const [audIds, setAudIds] = useState<string[]>([]);
  const [audPhones, setAudPhones] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }, { data: c }, { data: m }, { data: mt }, { data: dv }] = await Promise.all([
      supabase.from("sms_provider_settings").select("*").maybeSingle(),
      supabase.from("sms_templates").select("*").order("event_key"),
      supabase.from("sms_campaigns").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("sms_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("customer_types").select("id, name").eq("is_active", true),
      supabase.from("divisions").select("id, name").eq("is_active", true),
    ]);
    setSettings(s as any);
    setTemplates((t as any) || []);
    setCampaigns(c || []);
    setMessages(m || []);
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
    const { error } = await supabase.from("sms_provider_settings").update({
      ...settings, request_template: req, headers: hdr,
    }).eq("id", settings.id!);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const saveTemplate = async (tpl: Template) => {
    const { error } = await supabase.from("sms_templates").update({
      body: tpl.body, enabled: tpl.enabled, name: tpl.name,
    }).eq("id", tpl.id);
    if (error) toast.error(error.message); else toast.success("Template saved");
  };

  const sendBulk = async () => {
    if (!bulkMessage.trim()) { toast.error("Message required"); return; }
    setSending(true);
    const audience_filter: any = { type: audType };
    if (audType === "membership" || audType === "division") audience_filter.ids = audIds;
    if (audType === "manual") audience_filter.phones = audPhones.split(/[\s,]+/).filter(Boolean);
    const { data, error } = await supabase.functions.invoke("sms-send", {
      body: { action: "bulk", name: bulkName, message: bulkMessage, audience_filter },
    });
    setSending(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    toast.success(`Sent: ${(data as any).sent} / Failed: ${(data as any).failed}`);
    setBulkName(""); setBulkMessage(""); setAudPhones(""); setAudIds([]);
    load();
  };

  if (loading || !settings) return <div className="p-6"><Loader2 className="animate-spin h-5 w-5" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-1">SMS Marketing</h1>
      <p className="text-sm text-muted-foreground mb-4">Provider, transactional triggers, bulk campaigns and history. Train via AI Assistant or edit here.</p>

      <Tabs defaultValue="bulk">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bulk">Bulk Send</TabsTrigger>
          <TabsTrigger value="templates">Auto Triggers</TabsTrigger>
          <TabsTrigger value="settings">Provider Settings</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* BULK */}
        <TabsContent value="bulk" className="space-y-3 mt-4">
          <div className="border p-4 rounded-md space-y-3">
            <Input placeholder="Campaign name (optional)" value={bulkName} onChange={e => setBulkName(e.target.value)} />
            <Textarea rows={4} placeholder="Message body — use {name} for personalisation" value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} />
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={audType} onValueChange={(v: any) => { setAudType(v); setAudIds([]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All active customers</SelectItem>
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
                <Textarea rows={4} placeholder="Phone numbers (comma or newline separated)" value={audPhones} onChange={e => setAudPhones(e.target.value)} />
              )}
            </div>
            <Button onClick={sendBulk} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Bulk SMS
            </Button>
          </div>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-3 mt-4">
          {templates.map((tpl, i) => (
            <div key={tpl.id} className="border p-4 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tpl.name} <span className="text-xs text-muted-foreground">({tpl.event_key})</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={tpl.enabled} onCheckedChange={v => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, enabled: v } : t))} />
                </div>
              </div>
              <Textarea rows={3} value={tpl.body} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, body: e.target.value } : t))} />
              <p className="text-xs text-muted-foreground">Placeholders: {"{name}, {phone}, {order_number}, {total}, {tracking}"}</p>
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
            <Input placeholder="Provider name" value={settings.provider_name || ""} onChange={e => setSettings(s => ({ ...s!, provider_name: e.target.value }))} />
            <Input placeholder="Endpoint URL (supports {api_key} {sender_id} {phone} {message})" value={settings.endpoint_url || ""} onChange={e => setSettings(s => ({ ...s!, endpoint_url: e.target.value }))} />
            <Select value={settings.http_method} onValueChange={v => setSettings(s => ({ ...s!, http_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="API key" value={settings.api_key || ""} onChange={e => setSettings(s => ({ ...s!, api_key: e.target.value }))} />
            <Input placeholder="Sender ID" value={settings.sender_id || ""} onChange={e => setSettings(s => ({ ...s!, sender_id: e.target.value }))} />
            <Input placeholder="Success keyword (e.g. success)" value={settings.success_keyword || ""} onChange={e => setSettings(s => ({ ...s!, success_keyword: e.target.value }))} />
            <div>
              <Label className="text-xs">Headers (JSON)</Label>
              <Textarea rows={3} value={typeof settings.headers === "string" ? settings.headers : JSON.stringify(settings.headers, null, 2)}
                onChange={e => setSettings(s => ({ ...s!, headers: e.target.value as any }))} />
            </div>
            <div>
              <Label className="text-xs">Request body template (JSON, with placeholders)</Label>
              <Textarea rows={5} value={typeof settings.request_template === "string" ? settings.request_template : JSON.stringify(settings.request_template, null, 2)}
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
              <thead className="bg-muted"><tr><th className="text-left p-2">Phone</th><th className="text-left">Body</th><th>Status</th><th>Trigger</th><th>When</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{m.phone}</td>
                    <td className="text-xs">{m.body}</td>
                    <td className="text-center"><span className={m.status === "sent" ? "text-green-600" : "text-red-600"}>{m.status}</span></td>
                    <td className="text-center text-xs">{m.trigger_event}</td>
                    <td className="text-xs">{new Date(m.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!messages.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No SMS sent yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
