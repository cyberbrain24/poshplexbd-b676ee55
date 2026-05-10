import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Check, X, Sparkles, Image as ImageIcon, Wand2 } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  role: "user" | "assistant" | "tool" | "system";
  content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
};

type PendingAction = { tool_call_id: string; name: string; args: any };

const PRODUCT_IMAGES_BUCKET = "product-images";

interface Props {
  /** When rendered as a floating dock (vs full page), reduces height */
  embedded?: boolean;
}

export default function AdminProductAI({ embedded = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pending]);

  const callBackend = async (newMessages: Msg[], confirmedAction?: PendingAction, autoApproveWrites?: boolean) => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-product-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: newMessages,
          confirmed_action: confirmedAction,
          auto_approve_writes: autoApproveWrites ?? bulkMode,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Request failed");

      setMessages(data.messages || newMessages);
      if (data.type === "confirm") {
        setPending(data.pending_action);
      } else {
        setPending(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!input.trim() && !attachedImageUrl) return;
    let text = input.trim();
    if (attachedImageUrl) {
      text = `[Image uploaded: ${attachedImageUrl}]\n\n${text || "Please use this image."}`;
    }
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setAttachedImageUrl(null);
    await callBackend(next);
  };

  const approve = async (autoRest = false) => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    if (autoRest) {
      setBulkMode(true);
      toast.success("Bulk mode on — remaining steps will auto-run");
    }
    await callBackend(messages, action, autoRest || bulkMode);
  };

  const reject = () => {
    if (!pending) return;
    const next: Msg[] = [
      ...messages,
      { role: "tool", tool_call_id: pending.tool_call_id, content: JSON.stringify({ cancelled: true, reason: "User rejected the action." }) },
    ];
    setPending(null);
    setMessages(next);
    callBackend(next);
  };

  const onUpload = async (file: File) => {
    setAttaching(true);
    try {
      const path = `ai-uploads/${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, "_")}`;
      const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
      setAttachedImageUrl(data.publicUrl);
      toast.success("Image attached");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setAttaching(false);
    }
  };

  const generateImage = async () => {
    const prompt = window.prompt("Describe the image to generate:");
    if (!prompt) return;
    setAttaching(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      // Use Lovable AI image gen via a tiny inline call to the same gateway-style image model
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-seo-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind: "image", prompt }),
      }).catch(() => null);
      // Fallback: tell user image gen requires a separate function
      if (!resp || !resp.ok) {
        // Quick path: ask AI to use an external generated image URL via uploads instead
        toast.info("Tip: upload an image instead, or describe the product and the AI will create it.");
        return;
      }
      const data = await resp.json();
      if (data.image_url) {
        setAttachedImageUrl(data.image_url);
        toast.success("Image generated");
      }
    } catch (e: any) {
      toast.error("Image generation failed");
    } finally {
      setAttaching(false);
    }
  };

  const visibleMessages = messages.filter((m) => m.role === "user" || (m.role === "assistant" && m.content));

  return (
    <div className={`flex flex-col bg-background ${embedded ? "h-[600px] max-h-[80vh]" : "h-[calc(100vh-8rem)]"} border border-border rounded-lg overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Sparkles className="h-4 w-4" />
        <div className="flex-1">
          <div className="text-sm font-semibold uppercase tracking-wide">Product AI</div>
          <div className="text-[11px] text-muted-foreground">Manage products in plain English</div>
        </div>
        {bulkMode && (
          <button
            onClick={() => { setBulkMode(false); toast.message("Bulk mode off"); }}
            className="text-[10px] uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-500/30 hover:bg-amber-500/25"
            title="Click to turn off auto-approve"
          >
            Bulk: ON
          </button>
        )}
        {messages.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setMessages([]); setPending(null); setBulkMode(false); }}>Clear</Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Try asking:</p>
            <ul className="space-y-1 list-disc pl-5">
              <li>"List all products"</li>
              <li>"Change Blood Throne price to 699"</li>
              <li>"Mark Crop Crore as featured"</li>
              <li>"Create a new t-shirt called Night Wolf at 549 Taka"</li>
              <li>"Deactivate Mummy"</li>
              <li>"How many orders do we have?"</li>
            </ul>
          </div>
        )}

        {visibleMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "bg-foreground text-background" : "bg-muted"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                  <ReactMarkdown>{m.content || ""}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="border-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Confirm action
            </div>
            <div className="text-xs">
              AI wants to <strong>{pending.name}</strong>
            </div>
            <pre className="text-[11px] bg-background/60 rounded p-2 overflow-auto max-h-32">{JSON.stringify(pending.args, null, 2)}</pre>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => approve(false)} disabled={loading}>
                <Check className="h-3 w-3 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={() => approve(true)} disabled={loading} title="Auto-execute all remaining steps in this workflow">
                <Check className="h-3 w-3 mr-1" /> Approve All (auto-run rest)
              </Button>
              <Button size="sm" variant="outline" onClick={reject} disabled={loading}>
                <X className="h-3 w-3 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {attachedImageUrl && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-2">
          <img src={attachedImageUrl} alt="" className="h-10 w-10 object-cover rounded" />
          <span className="text-xs flex-1 truncate">Image ready to attach</span>
          <Button size="sm" variant="ghost" onClick={() => setAttachedImageUrl(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="border-t border-border p-2 flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
        <Button size="icon" variant="outline" disabled={attaching || loading} onClick={() => fileRef.current?.click()} title="Upload image">
          {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder={pending ? "Approve or reject above…" : "Ask anything about products…"}
          disabled={loading || !!pending}
        />
        <Button onClick={send} disabled={loading || !!pending || (!input.trim() && !attachedImageUrl)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
