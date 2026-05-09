import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, MessageSquare, ThumbsUp, ThumbsDown, ImagePlus, Loader2, X, Pencil, Save, Copy, RefreshCcw, Search, ShoppingCart, AlertTriangle, CheckCircle2, Globe, Facebook, Instagram, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-webhook`;
const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" };
const randomToken = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export default function AdminChatbot() {
  const qc = useQueryClient();

  // ====== Settings ======
  const { data: settings } = useQuery({
    queryKey: ["chatbot-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chatbot_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [enabled, setEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcome, setWelcome] = useState("");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [blockedTopicsText, setBlockedTopicsText] = useState("");

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setSystemPrompt(settings.system_prompt);
    setWelcome(settings.welcome_message);
    setModel(settings.model);
    setBlockedTopicsText((settings.blocked_topics as string[] || []).join(", "));
  }, [settings]);

  const saveSettings = async () => {
    if (!settings) return;
    const blocked = blockedTopicsText.split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase
      .from("chatbot_settings")
      .update({
        enabled, system_prompt: systemPrompt, welcome_message: welcome,
        model, blocked_topics: blocked,
      })
      .eq("id", settings.id);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries({ queryKey: ["chatbot-settings"] });
  };

  // ====== FAQs ======
  const { data: faqs = [] } = useQuery({
    queryKey: ["chatbot-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chatbot_faqs").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [newImage, setNewImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chatbot-faq/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      setNewImage(publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addFaq = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chatbot_faqs").insert({
        question: newQ, answer: newA, image_url: newImage || null, sort_order: faqs.length,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("FAQ added"); setNewQ(""); setNewA(""); setNewImage(""); qc.invalidateQueries({ queryKey: ["chatbot-faqs"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("chatbot_faqs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["chatbot-faqs"] });
  };

  const toggleFaq = async (id: string, is_active: boolean) => {
    await supabase.from("chatbot_faqs").update({ is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["chatbot-faqs"] });
  };

  // ====== Edit FAQ ======
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [editImage, setEditImage] = useState<string>("");
  const [editUploading, setEditUploading] = useState(false);
  const editFileRef = useRef<HTMLInputElement>(null);

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setEditQ(f.question);
    setEditA(f.answer);
    setEditImage(f.image_url || "");
  };
  const cancelEdit = () => { setEditingId(null); setEditQ(""); setEditA(""); setEditImage(""); };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setEditUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `chatbot-faq/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      setEditImage(publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setEditUploading(false);
      if (editFileRef.current) editFileRef.current.value = "";
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("chatbot_faqs").update({
      question: editQ, answer: editA, image_url: editImage || null,
    }).eq("id", editingId);
    if (error) return toast.error(error.message);
    toast.success("FAQ updated");
    cancelEdit();
    qc.invalidateQueries({ queryKey: ["chatbot-faqs"] });
  };

  // ====== Conversations + filters ======
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: conversations = [] } = useQuery({
    queryKey: ["chatbot-conversations", filterTag, filterChannel, filterFrom, filterTo, debouncedSearch],
    queryFn: async () => {
      // If searching message text, first find matching conversation IDs
      let convIdFilter: string[] | null = null;
      if (debouncedSearch) {
        const { data: matches } = await supabase
          .from("chatbot_messages")
          .select("conversation_id")
          .ilike("content", `%${debouncedSearch}%`)
          .limit(500);
        convIdFilter = Array.from(new Set((matches || []).map((m: any) => m.conversation_id)));
        if (convIdFilter.length === 0) return [];
      }

      let q = supabase
        .from("chatbot_conversations")
        .select("*, customer:customers(name, phone), meta:meta_conversations(display_name)")
        .order("last_message_at", { ascending: false })
        .limit(200);

      if (filterTag !== "all") q = q.eq("tag", filterTag);
      if (filterChannel !== "all") q = q.eq("channel", filterChannel);
      if (filterFrom) q = q.gte("last_message_at", new Date(filterFrom).toISOString());
      if (filterTo) {
        const to = new Date(filterTo); to.setHours(23, 59, 59, 999);
        q = q.lte("last_message_at", to.toISOString());
      }
      if (convIdFilter) q = q.in("id", convIdFilter);

      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const selectedConvData = conversations.find((c: any) => c.id === selectedConv);

  const { data: convMessages = [] } = useQuery({
    queryKey: ["chatbot-messages", selectedConv],
    enabled: !!selectedConv,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conversation_id", selectedConv!)
        .order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const updateConvTag = async (id: string, tag: string) => {
    const { error } = await supabase.from("chatbot_conversations").update({ tag }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(tag === "none" ? "Cleared tag" : `Marked as ${tag}`);
    qc.invalidateQueries({ queryKey: ["chatbot-conversations"] });
  };

  const setFeedback = async (id: string, feedback: "good" | "bad") => {
    await supabase.from("chatbot_messages").update({ feedback }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["chatbot-messages", selectedConv] });
    toast.success("Feedback saved");
  };

  // ====== Analytics ======
  const totalConvs = conversations.length;
  const totalMsgs = conversations.reduce((sum: number, c: any) => sum + (c.message_count || 0), 0);
  const today = new Date(); today.setHours(0,0,0,0);
  const todayConvs = conversations.filter((c: any) => new Date(c.created_at) >= today).length;

  // ====== Meta Channels (WhatsApp / Messenger / Instagram) ======
  const { data: metaChannels = [] } = useQuery({
    queryKey: ["meta-channels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meta_channels").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const [newCh, setNewCh] = useState<{ channel: string; display_name: string; verify_token: string }>({
    channel: "whatsapp", display_name: "", verify_token: randomToken(),
  });

  const addChannel = async () => {
    if (!newCh.display_name || !newCh.verify_token) return toast.error("Name and verify token required");
    const { error } = await supabase.from("meta_channels").insert({
      channel: newCh.channel, display_name: newCh.display_name, verify_token: newCh.verify_token, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Channel created — now paste the credentials below");
    setNewCh({ channel: "whatsapp", display_name: "", verify_token: randomToken() });
    qc.invalidateQueries({ queryKey: ["meta-channels"] });
  };

  const updateChannel = async (id: string, patch: any) => {
    const { error } = await supabase.from("meta_channels").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["meta-channels"] });
  };

  const deleteChannel = async (id: string) => {
    if (!confirm("Delete this channel? Existing conversation mappings will be removed.")) return;
    const { error } = await supabase.from("meta_channels").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["meta-channels"] });
  };

  const copyText = (s: string) => { navigator.clipboard.writeText(s); toast.success("Copied"); };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight uppercase">Customer Chatbot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the AI assistant, train it with FAQs, monitor conversations, and analyze performance.
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="faqs">FAQs ({faqs.length})</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="meta">Meta DM ({metaChannels.length})</TabsTrigger>
        </TabsList>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Chatbot Enabled</Label>
                <p className="text-xs text-muted-foreground">Turn the customer chat widget on or off site-wide.</p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-2">
              <Label>Welcome Message</Label>
              <Textarea value={welcome} onChange={(e) => setWelcome(e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>System Prompt (bot personality + rules)</Label>
              <Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={8} />
              <p className="text-xs text-muted-foreground">The bot can only discuss products, orders, shipping, returns, and accounts. This prompt sets its tone and behavior.</p>
            </div>

            <div className="space-y-2">
              <Label>Blocked Topics (comma-separated)</Label>
              <Input value={blockedTopicsText} onChange={(e) => setBlockedTopicsText(e.target.value)} placeholder="politics, competitors, personal advice" />
            </div>

            <div className="space-y-2">
              <Label>AI Model</Label>
              <select className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="google/gemini-3-flash-preview">Gemini 3 Flash (fast, default)</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="google/gemini-2.5-pro">Gemini 2.5 Pro (smarter)</option>
                <option value="openai/gpt-5-mini">GPT-5 Mini</option>
                <option value="openai/gpt-5">GPT-5</option>
              </select>
            </div>

            <Button onClick={saveSettings}>Save Settings</Button>
          </Card>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs" className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wider">Add Knowledge / FAQ</h3>
            <Input placeholder="Question" value={newQ} onChange={(e) => setNewQ(e.target.value)} />
            <Textarea placeholder="Answer the bot should give" value={newA} onChange={(e) => setNewA(e.target.value)} rows={3} />

            <div className="space-y-2">
              <Label className="text-xs">Image (optional — bot will reply with this image)</Label>
              {newImage ? (
                <div className="relative inline-block">
                  <img src={newImage} alt="FAQ" className="h-24 w-24 object-cover rounded border border-border" />
                  <button
                    type="button"
                    onClick={() => setNewImage("")}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md text-xs cursor-pointer hover:bg-muted">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload Image"}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <Button onClick={() => addFaq.mutate()} disabled={!newQ || !newA || uploading}>
              <Plus className="h-4 w-4 mr-1" /> Add FAQ
            </Button>
          </Card>

          <div className="space-y-2">
            {faqs.map((f: any) => {
              const isEditing = editingId === f.id;
              if (isEditing) {
                return (
                  <Card key={f.id} className="p-4 space-y-3 border-foreground">
                    <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="Question" />
                    <Textarea value={editA} onChange={(e) => setEditA(e.target.value)} rows={3} placeholder="Answer" />
                    <div className="space-y-2">
                      <Label className="text-xs">Image (optional)</Label>
                      {editImage ? (
                        <div className="relative inline-block">
                          <img src={editImage} alt="FAQ" className="h-24 w-24 object-cover rounded border border-border" />
                          <button type="button" onClick={() => setEditImage("")} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-md text-xs cursor-pointer hover:bg-muted">
                          {editUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                          {editUploading ? "Uploading..." : "Upload Image"}
                          <input ref={editFileRef} type="file" accept="image/*" onChange={handleEditImageUpload} className="hidden" disabled={editUploading} />
                        </label>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} disabled={!editQ || !editA || editUploading} size="sm">
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </Card>
                );
              }
              return (
                <Card key={f.id} className="p-4 flex justify-between gap-3">
                  <div className="flex-1 flex gap-3">
                    {f.image_url && (
                      <img src={f.image_url} alt="" className="h-16 w-16 object-cover rounded border border-border shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{f.question}</p>
                      <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{f.answer}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch checked={f.is_active} onCheckedChange={(v) => toggleFaq(f.id, v)} />
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(f)} className="text-muted-foreground hover:text-foreground" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteFaq(f.id)} className="text-destructive hover:opacity-70" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {faqs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No FAQs yet. Add the first one above.</p>}
          </div>
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations" className="space-y-3">
          {/* Filters */}
          <Card className="p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages…"
                className="pl-8 h-9"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Tag</Label>
              <select className="w-full border border-border rounded-md px-2 h-9 text-sm bg-background"
                value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                <option value="all">All</option>
                <option value="none">Untagged</option>
                <option value="order">Orders</option>
                <option value="complaint">Complaints (open)</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase">Channel</Label>
              <select className="w-full border border-border rounded-md px-2 h-9 text-sm bg-background"
                value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)}>
                <option value="all">All</option>
                <option value="web">Website</option>
                <option value="messenger">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase">From</Label>
              <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-[10px] uppercase">To</Label>
              <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-9" />
            </div>
            {(filterTag !== "all" || filterChannel !== "all" || filterFrom || filterTo || searchTerm) && (
              <Button variant="ghost" size="sm" className="md:col-span-6 justify-self-end h-7"
                onClick={() => { setFilterTag("all"); setFilterChannel("all"); setFilterFrom(""); setFilterTo(""); setSearchTerm(""); }}>
                <X className="h-3 w-3 mr-1" /> Clear filters
              </Button>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1 max-h-[600px] overflow-y-auto">
              {conversations.map((c: any) => {
                const name = displayNameFor(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConv(c.id)}
                    className={`w-full text-left p-3 border rounded-md text-xs ${selectedConv === c.id ? "bg-muted border-foreground" : "border-border hover:bg-muted/40"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{name}</div>
                      <ChannelIcon channel={c.channel} />
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {c.message_count} msgs · {new Date(c.last_message_at).toLocaleDateString()}
                    </div>
                    {c.tag && c.tag !== "none" && (
                      <div className="mt-1"><TagBadge tag={c.tag} /></div>
                    )}
                  </button>
                );
              })}
              {conversations.length === 0 && <p className="text-sm text-muted-foreground p-4">No conversations match.</p>}
            </div>

            <div className="md:col-span-2">
              {selectedConv && selectedConvData ? (
                <div className="space-y-2">
                  <Card className="p-3 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-sm">
                      <ChannelIcon channel={selectedConvData.channel} />
                      <span className="font-semibold">{displayNameFor(selectedConvData)}</span>
                      {selectedConvData.tag !== "none" && <TagBadge tag={selectedConvData.tag} />}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button size="sm" variant={selectedConvData.tag === "order" ? "default" : "outline"}
                        onClick={() => updateConvTag(selectedConv!, "order")}>
                        <ShoppingCart className="h-3 w-3 mr-1" /> Order
                      </Button>
                      <Button size="sm" variant={selectedConvData.tag === "complaint" ? "default" : "outline"}
                        onClick={() => updateConvTag(selectedConv!, "complaint")}>
                        <AlertTriangle className="h-3 w-3 mr-1" /> Complaint
                      </Button>
                      <Button size="sm" variant={selectedConvData.tag === "resolved" ? "default" : "outline"}
                        onClick={() => updateConvTag(selectedConv!, "resolved")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
                      </Button>
                      {selectedConvData.tag !== "none" && (
                        <Button size="sm" variant="ghost" onClick={() => updateConvTag(selectedConv!, "none")}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4 max-h-[540px] overflow-y-auto space-y-3">
                    {convMessages.map((m: any) => (
                      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === "user" ? "bg-foreground text-background" : "bg-muted"}`}>
                          <div className="text-[10px] uppercase opacity-60 mb-1">{m.role}</div>
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          {m.role === "assistant" && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => setFeedback(m.id, "good")} className={m.feedback === "good" ? "text-green-600" : "opacity-50"}>
                                <ThumbsUp size={12} />
                              </button>
                              <button onClick={() => setFeedback(m.id, "bad")} className={m.feedback === "bad" ? "text-red-600" : "opacity-50"}>
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm border border-dashed border-border rounded-md">
                  <MessageSquare className="h-5 w-5 mr-2" /> Select a conversation
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Conversations</p><p className="text-2xl font-bold mt-1">{totalConvs}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Today</p><p className="text-2xl font-bold mt-1">{todayConvs}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground uppercase">Total Messages</p><p className="text-2xl font-bold mt-1">{totalMsgs}</p></Card>
          </div>
        </TabsContent>

        {/* Meta DM Channels */}
        <TabsContent value="meta" className="space-y-4">
          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wider">How to connect</h3>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
              <li>Create a Meta App at developers.facebook.com → add WhatsApp / Messenger / Instagram product.</li>
              <li>Add a channel below for each platform — pick a Display name, copy the auto-generated Verify Token.</li>
              <li>In the Meta App's Webhooks section, paste the Webhook URL and Verify Token shown on each card.</li>
              <li>Subscribe to <code>messages</code> (WhatsApp) or <code>messages</code> + <code>messaging_postbacks</code> (Messenger/Instagram).</li>
              <li>Paste your Page Access Token / Phone Number ID / App Secret into the channel card and save.</li>
            </ol>
            <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded">
              <span className="font-mono break-all flex-1">{WEBHOOK_URL}</span>
              <Button size="sm" variant="ghost" onClick={() => copyText(WEBHOOK_URL)}><Copy className="h-3 w-3" /></Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <h3 className="font-medium text-sm uppercase tracking-wider">Add Channel</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={newCh.channel}
                onChange={(e) => setNewCh({ ...newCh, channel: e.target.value })}
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
                <option value="instagram">Instagram</option>
              </select>
              <Input
                placeholder="Display name (e.g. POSHPLEX WhatsApp)"
                value={newCh.display_name}
                onChange={(e) => setNewCh({ ...newCh, display_name: e.target.value })}
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Verify token"
                  value={newCh.verify_token}
                  onChange={(e) => setNewCh({ ...newCh, verify_token: e.target.value })}
                />
                <Button variant="outline" size="icon" onClick={() => setNewCh({ ...newCh, verify_token: randomToken() })} title="Regenerate">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={addChannel} disabled={!newCh.display_name}>
              <Plus className="h-4 w-4 mr-1" /> Add Channel
            </Button>
          </Card>

          <div className="space-y-3">
            {metaChannels.map((c: any) => (
              <Card key={c.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-semibold uppercase text-sm">{CHANNEL_LABEL[c.channel] || c.channel} · {c.display_name}</div>
                    <div className="text-xs text-muted-foreground">Created {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.is_active} onCheckedChange={(v) => updateChannel(c.id, { is_active: v })} />
                    <button onClick={() => deleteChannel(c.id)} className="text-destructive hover:opacity-70" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Webhook URL</Label>
                    <div className="flex gap-1">
                      <Input readOnly value={WEBHOOK_URL} className="font-mono text-[11px]" />
                      <Button variant="outline" size="icon" onClick={() => copyText(WEBHOOK_URL)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase">Verify Token</Label>
                    <div className="flex gap-1">
                      <Input readOnly value={c.verify_token} className="font-mono text-[11px]" />
                      <Button variant="outline" size="icon" onClick={() => copyText(c.verify_token)}><Copy className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>

                <ChannelCredentialsForm channel={c} onSave={updateChannel} />
              </Card>
            ))}
            {metaChannels.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No Meta channels yet. Add one above to start receiving DMs.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChannelCredentialsForm({ channel, onSave }: { channel: any; onSave: (id: string, patch: any) => void }) {
  const [form, setForm] = useState({
    page_id: channel.page_id || "",
    phone_number_id: channel.phone_number_id || "",
    business_account_id: channel.business_account_id || "",
    app_id: channel.app_id || "",
    app_secret: channel.app_secret || "",
    access_token: channel.access_token || "",
    notes: channel.notes || "",
  });

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
        {channel.channel === "whatsapp" ? (
          <>
            <LabeledInput label="Phone Number ID" value={form.phone_number_id} onChange={(v) => setForm({ ...form, phone_number_id: v })} />
            <LabeledInput label="WhatsApp Business Account ID" value={form.business_account_id} onChange={(v) => setForm({ ...form, business_account_id: v })} />
          </>
        ) : (
          <LabeledInput label="Page ID" value={form.page_id} onChange={(v) => setForm({ ...form, page_id: v })} />
        )}
        <LabeledInput label="App ID" value={form.app_id} onChange={(v) => setForm({ ...form, app_id: v })} />
        <LabeledInput label="App Secret" value={form.app_secret} onChange={(v) => setForm({ ...form, app_secret: v })} type="password" />
        <LabeledInput label="Access Token (permanent)" value={form.access_token} onChange={(v) => setForm({ ...form, access_token: v })} type="password" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase">Notes</Label>
        <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button size="sm" onClick={() => onSave(channel.id, form)}>
        <Save className="h-3 w-3 mr-1" /> Save Credentials
      </Button>
    </div>
  );
}

function LabeledInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-[11px]" />
    </div>
  );
}

function displayNameFor(c: any): string {
  if (c?.customer?.name) return c.customer.name;
  if (c?.customer?.phone) return c.customer.phone;
  const metaName = Array.isArray(c?.meta) ? c.meta[0]?.display_name : c?.meta?.display_name;
  if (metaName) return metaName;
  if (c?.display_name) return c.display_name;
  if (c?.guest_number) return `Guest ${c.guest_number}`;
  if (c?.external_user_id) return c.external_user_id;
  return "Guest";
}

function ChannelIcon({ channel }: { channel: string }) {
  const cls = "h-3.5 w-3.5";
  if (channel === "whatsapp") return <MessageCircle className={cls + " text-green-600"} aria-label="WhatsApp" />;
  if (channel === "messenger") return <Facebook className={cls + " text-blue-600"} aria-label="Facebook" />;
  if (channel === "instagram") return <Instagram className={cls + " text-pink-600"} aria-label="Instagram" />;
  return <Globe className={cls + " text-muted-foreground"} aria-label="Website" />;
}

function TagBadge({ tag }: { tag: string }) {
  if (tag === "order") return <Badge className="bg-blue-600 hover:bg-blue-600 text-white"><ShoppingCart className="h-3 w-3 mr-1" />Order</Badge>;
  if (tag === "complaint") return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Complaint</Badge>;
  if (tag === "resolved") return <Badge className="bg-green-600 hover:bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
  return null;
}
