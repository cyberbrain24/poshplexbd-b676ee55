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
import { Loader2, Send, AlertTriangle } from "lucide-react";

type Settings = {
  id?: string; provider_name: string; endpoint_url: string; http_method: string;
  request_template: any; headers: any; access_token: string; ig_user_id: string;
  sender_display_name: string; success_keyword: string; enabled: boolean; notes: string;
};
type Template = { id: string; event_key: string; name: string; category: string; media_url: string; body: string; variables: any; enabled: boolean; };

export default function AdminInstagramMarketing() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [suppression, setSuppression] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [bulkName, setBulkName] = useState("");
  const [bulkBody, setBulkBody] = useState("Hi {name}, new drop just landed at POSHPLEX. Shop now: https://poshplexbd.com");
  const [bulkMedia, setBulkMedia] = useState("");
  const [audType, setAudType] = useState<"all" | "manual">("all");
  const [audIds, setAudIds] = useState("");
  const [sending, setSending] = useState(false);

  const [newSubId, setNewSubId] = useState("");
  const [newSubUsername, setNewSubUsername] = useState("");
  const [optoutId, setOptoutId] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: t }, { data: c }, { data: m }, { data: sup }, { data: subs }] = await Promise.all([
      supabase.from("ig_provider_settings").select("*").maybeSingle(),
      supabase.from("ig_templates").select("*").order("event_key"),
      supabase.from("ig_campaigns").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("ig_messages").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ig_suppression").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("ig_subscribers").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setSettings(s as any); setTemplates((t as any) || []); setCampaigns(c || []); setMessages(m || []); setSuppression(sup || []); setSubscribers(subs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    let req = settings.request_template, hdr = settings.headers;
    try { if (typeof req === "string") req = JSON.parse(req); } catch { toast.error("Request template must be valid JSON"); return; }
    try { if (typeof hdr === "string") hdr = JSON.parse(hdr); } catch { toast.error("Headers must be valid JSON"); return; }
    const { error } = await supabase.from("ig_provider_settings").update({ ...settings, request_template: req, headers: hdr }).eq("id", settings.id!);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  };

  const saveTemplate = async (tpl: Template) => {
    const { error } = await supabase.from("ig_templates").update({ name: tpl.name, body: tpl.body, media_url: tpl.media_url, enabled: tpl.enabled }).eq("id", tpl.id);
    if (error) toast.error(error.message); else toast.success("Template saved");
  };

  const sendBulk = async () => {
    if (!bulkBody.trim()) { toast.error("Message body required"); return; }
    setSending(true);
    const audience_filter: any = { type: audType };
    if (audType === "manual") audience_filter.ids_text = audIds.split(/[\s,\n]+/).filter(Boolean);
    const { data, error } = await supabase.functions.invoke("instagram-marketing-send", {
      body: { action: "bulk", name: bulkName, body: bulkBody, media_url: bulkMedia, audience_filter },
    });
    setSending(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
    toast.success(`Sent: ${(data as any).sent} / Failed: ${(data as any).failed}`);
    setBulkName(""); setAudIds("");
    load();
  };

  const addSubscriber = async () => {
    if (!newSubId.trim()) return;
    const { error } = await supabase.from("ig_subscribers").insert({ ig_id: newSubId.trim(), username: newSubUsername.trim() || null, source: "admin" });
    if (error) toast.error(error.message); else { toast.success("Subscriber added"); setNewSubId(""); setNewSubUsername(""); load(); }
  };
  const removeSubscriber = async (id: string) => {
    const { error } = await supabase.from("ig_subscribers").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };
  const addSuppression = async () => {
    if (!optoutId.trim()) return;
    const { error } = await supabase.from("ig_suppression").insert({ ig_id: optoutId.trim(), reason: "manual", source: "admin" });
    if (error) toast.error(error.message); else { toast.success("Added"); setOptoutId(""); load(); }
  };
  const removeSuppression = async (id: string) => {
    const { error } = await supabase.from("ig_suppression").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };

  if (loading || !settings) return <div className="p-6"><Loader2 className="animate-spin h-5 w-5" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold uppercase tracking-tight mb-1">Instagram DM Marketing</h1>
      <p className="text-sm text-muted-foreground mb-3">Bulk Instagram DMs to opted-in subscribers. Fashion templates, provider settings, history, opt-outs.</p>

      <div className="flex items-start gap-2 text-xs border-l-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded mb-4">
        <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
        <div>Instagram only allows marketing DMs inside the 24-hour user-initiated window or via approved Recurring Notifications / Human Agent tags. Ensure recipients meet Meta policy before bulk sending.</div>
      </div>

      <Tabs defaultValue="bulk">
        <TabsList className="flex-wrap">
          <TabsTrigger value="bulk">Bulk Send</TabsTrigger>
          <TabsTrigger value="templates">Auto Triggers</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="settings">Provider Settings</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="optouts">Opt-outs</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="space-y-3 mt-4">
          <div className="border p-4 rounded-md space-y-3">
            <Input placeholder="Campaign name (optional)" value={bulkName} onChange={e => setBulkName(e.target.value)} />
            <Textarea rows={5} placeholder="Message body — use {name}" value={bulkBody} onChange={e => setBulkBody(e.target.value)} />
            <Input placeholder="Optional media URL (image / video)" value={bulkMedia} onChange={e => setBulkMedia(e.target.value)} />
            <div>
              <Label className="text-xs mb-1 block">Instagram DM preview</Label>
              <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-3 rounded">
                <div className="bg-white max-w-sm rounded-2xl p-3 shadow text-sm whitespace-pre-wrap text-black">
                  {bulkMedia && <div className="mb-2 text-xs text-gray-500 border rounded p-2 break-all">📎 {bulkMedia}</div>}
                  {bulkBody.replace(/\{name\}/g, "Sadia")}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Audience</Label>
                <Select value={audType} onValueChange={(v: any) => setAudType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All opted-in subscribers</SelectItem>
                    <SelectItem value="manual">Manual IG IDs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {audType === "manual" && (
                <Textarea rows={4} placeholder="IG-scoped recipient IDs (comma or newline)" value={audIds} onChange={e => setAudIds(e.target.value)} />
              )}
            </div>
            <Button onClick={sendBulk} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Instagram Campaign
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-3 mt-4">
          {templates.map((tpl, i) => (
            <div key={tpl.id} className="border p-4 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{tpl.name} <span className="text-xs text-muted-foreground">({tpl.event_key} · {tpl.category})</span></div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={tpl.enabled} onCheckedChange={v => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, enabled: v } : t))} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <Input placeholder="Name" value={tpl.name} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, name: e.target.value } : t))} />
                <Input placeholder="Media URL" value={tpl.media_url} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, media_url: e.target.value } : t))} />
              </div>
              <Textarea rows={3} value={tpl.body} onChange={e => setTemplates(arr => arr.map((t, j) => j === i ? { ...t, body: e.target.value } : t))} />
              <p className="text-xs text-muted-foreground">Variables: {Array.isArray(tpl.variables) ? tpl.variables.join(", ") : ""}</p>
              <Button size="sm" onClick={() => saveTemplate(tpl)}>Save</Button>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-3 mt-4">
          <div className="border p-3 rounded-md grid md:grid-cols-3 gap-2">
            <Input placeholder="IG recipient ID" value={newSubId} onChange={e => setNewSubId(e.target.value)} />
            <Input placeholder="Username (optional)" value={newSubUsername} onChange={e => setNewSubUsername(e.target.value)} />
            <Button onClick={addSubscriber}>Add subscriber</Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">IG ID</th><th>Username</th><th>Opted in</th><th>Source</th><th></th></tr></thead>
              <tbody>
                {subscribers.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{s.ig_id}</td>
                    <td className="text-center text-xs">{s.username}</td>
                    <td className="text-center text-xs">{s.opted_in ? "Yes" : "No"}</td>
                    <td className="text-center text-xs">{s.source}</td>
                    <td className="text-right pr-2"><Button size="sm" variant="ghost" onClick={() => removeSubscriber(s.id)}>Remove</Button></td>
                  </tr>
                ))}
                {!subscribers.length && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No subscribers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3 mt-4">
          <div className="border p-4 rounded-md space-y-3">
            <div className="flex items-center justify-between"><Label>Enabled</Label>
              <Switch checked={settings.enabled} onCheckedChange={v => setSettings(s => ({ ...s!, enabled: v }))} />
            </div>
            <Input placeholder="Provider name (Meta Graph, ManyChat…)" value={settings.provider_name || ""} onChange={e => setSettings(s => ({ ...s!, provider_name: e.target.value }))} />
            <Input placeholder="Endpoint URL (supports {access_token} {ig_user_id} {to} {body})" value={settings.endpoint_url || ""} onChange={e => setSettings(s => ({ ...s!, endpoint_url: e.target.value }))} />
            <Select value={settings.http_method} onValueChange={v => setSettings(s => ({ ...s!, http_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="POST">POST</SelectItem><SelectItem value="GET">GET</SelectItem></SelectContent>
            </Select>
            <Input placeholder="Access token (Page access token)" value={settings.access_token || ""} onChange={e => setSettings(s => ({ ...s!, access_token: e.target.value }))} />
            <Input placeholder="Instagram User ID (IG Business account ID)" value={settings.ig_user_id || ""} onChange={e => setSettings(s => ({ ...s!, ig_user_id: e.target.value }))} />
            <Input placeholder="Sender display name" value={settings.sender_display_name || ""} onChange={e => setSettings(s => ({ ...s!, sender_display_name: e.target.value }))} />
            <Input placeholder="Success keyword (optional)" value={settings.success_keyword || ""} onChange={e => setSettings(s => ({ ...s!, success_keyword: e.target.value }))} />
            <div><Label className="text-xs">Headers (JSON)</Label>
              <Textarea rows={3} className="font-mono text-xs" value={typeof settings.headers === "string" ? settings.headers : JSON.stringify(settings.headers, null, 2)}
                onChange={e => setSettings(s => ({ ...s!, headers: e.target.value as any }))} />
            </div>
            <div><Label className="text-xs">Request body template (JSON, with placeholders)</Label>
              <Textarea rows={6} className="font-mono text-xs" value={typeof settings.request_template === "string" ? settings.request_template : JSON.stringify(settings.request_template, null, 2)}
                onChange={e => setSettings(s => ({ ...s!, request_template: e.target.value as any }))} />
            </div>
            <Button onClick={saveSettings}>Save Settings</Button>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">Name</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">{c.name}</td><td className="text-center">{c.recipient_count}</td>
                    <td className="text-center text-green-600">{c.sent_count}</td><td className="text-center text-red-600">{c.failed_count}</td>
                    <td className="text-center">{c.status}</td><td className="text-xs">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {!campaigns.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No campaigns yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">To</th><th className="text-left">Message</th><th>Status</th><th>When</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{m.to_id}</td>
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

        <TabsContent value="optouts" className="mt-4 space-y-3">
          <div className="border p-3 rounded-md flex gap-2">
            <Input placeholder="Add IG ID to opt-out list" value={optoutId} onChange={e => setOptoutId(e.target.value)} />
            <Button onClick={addSuppression}>Add</Button>
          </div>
          <div className="border rounded-md overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="text-left p-2">IG ID</th><th>Reason</th><th>Source</th><th>When</th><th></th></tr></thead>
              <tbody>
                {suppression.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 font-mono text-xs">{s.ig_id}</td>
                    <td className="text-center text-xs">{s.reason}</td><td className="text-center text-xs">{s.source}</td>
                    <td className="text-xs">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="text-right pr-2"><Button size="sm" variant="ghost" onClick={() => removeSuppression(s.id)}>Remove</Button></td>
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
