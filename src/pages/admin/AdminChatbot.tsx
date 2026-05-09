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
import { Plus, Trash2, MessageSquare, ThumbsUp, ThumbsDown, ImagePlus, Loader2, X, Pencil, Save, Copy, RefreshCcw } from "lucide-react";

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

  // ====== Conversations ======
  const { data: conversations = [] } = useQuery({
    queryKey: ["chatbot-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .select("*, customer:customers(name, phone)")
        .order("last_message_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const [selectedConv, setSelectedConv] = useState<string | null>(null);
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
        <TabsContent value="conversations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1 max-h-[600px] overflow-y-auto">
              {conversations.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedConv(c.id)}
                  className={`w-full text-left p-3 border rounded-md text-xs ${selectedConv === c.id ? "bg-muted border-foreground" : "border-border hover:bg-muted/40"}`}
                >
                  <div className="font-medium">
                    {c.customer?.name || c.customer?.phone || "Guest"}
                  </div>
                  <div className="text-muted-foreground">
                    {c.message_count} msgs · {new Date(c.last_message_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
              {conversations.length === 0 && <p className="text-sm text-muted-foreground p-4">No conversations yet.</p>}
            </div>

            <div className="md:col-span-2">
              {selectedConv ? (
                <Card className="p-4 max-h-[600px] overflow-y-auto space-y-3">
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
      </Tabs>
    </div>
  );
}
