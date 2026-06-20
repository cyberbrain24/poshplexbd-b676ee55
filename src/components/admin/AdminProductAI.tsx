import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Check, X, Sparkles, Image as ImageIcon, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { generatePackingListPdf } from "@/lib/orderPackingPdf";


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
  const [textareaHeight, setTextareaHeight] = useState(140);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);

  // Prompt queue
  const [queue, setQueue] = useState<string[]>([]);
  const [queueAutoApprove, setQueueAutoApprove] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Latest messages, accessible inside async queue runner without stale closure
  const messagesRef = useRef<Msg[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  // De-dupe client-side side effects (e.g. packing PDF) per tool_call_id.
  const processedActionsRef = useRef<Set<string>>(new Set());

  // Fetch orders with the same nested shape AdminOrders uses, then run the
  // shared packing-PDF generator so the output matches the All Orders page.
  const downloadPackingPdfForOrderIds = async (orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      toast.message(`Building packing list for ${orderIds.length} order(s)…`);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(id, name, phone, email),
          payment_method:payment_methods(id, name, type),
          shipping_division:divisions(id, name),
          shipping_thana:thanas(id, name),
          items:order_items(*, product:products(id, product_images(image_url, is_main, sort_order), product_categories(category:categories(id, name, parent_id, parent:categories!parent_id(id, name)))))
        `)
        .in("id", orderIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No matching orders found to print.");
        return;
      }
      await generatePackingListPdf(data as any);
      toast.success(`Packing list ready — ${data.length} order(s).`);
    } catch (e: any) {
      toast.error(e.message || "Failed to build packing PDF");
    }
  };

  // Watch newest tool messages for `client_action: "download_packing_pdf"` and run it once.
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "tool" || !m.tool_call_id || !m.content) continue;
      if (processedActionsRef.current.has(m.tool_call_id)) continue;
      try {
        const parsed = JSON.parse(m.content);
        if (parsed && parsed.client_action === "download_packing_pdf" && Array.isArray(parsed.order_ids) && parsed.order_ids.length) {
          processedActionsRef.current.add(m.tool_call_id);
          void downloadPackingPdfForOrderIds(parsed.order_ids);
        }
      } catch {
        // not JSON — ignore
      }
    }
  }, [messages]);


  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, pending, queue]);

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
          auto_approve_writes: autoApproveWrites ?? (bulkMode || queueAutoApprove),
        }),
      });
      const data = await resp.json();
      if (data?.error) throw new Error(data.error);
      if (!resp.ok) throw new Error(data.error || "Request failed");

      const updated: Msg[] = data.messages || newMessages;
      setMessages(updated);
      messagesRef.current = updated;
      if (data.type === "confirm") {
        setPending(data.pending_action);
        return { confirm: true as const, action: data.pending_action as PendingAction };
      } else {
        setPending(null);
        return { confirm: false as const };
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
      return { error: true as const };
    } finally {
      setLoading(false);
    }
  };

  // Drain the queue. Called whenever the runner is idle (no pending confirm,
  // not currently loading) and there are items waiting.
  useEffect(() => {
    if (loading || pending) return;
    if (queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    const nextMessages: Msg[] = [...messagesRef.current, { role: "user", content: next }];
    setMessages(nextMessages);
    messagesRef.current = nextMessages;
    void callBackend(nextMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, loading, pending]);

  const send = async () => {
    if (!input.trim() && !attachedImageUrl) return;
    let text = input.trim();
    if (attachedImageUrl) {
      text = `[Image uploaded: ${attachedImageUrl}]\n\n${text || "Please use this image."}`;
    }
    setInput("");
    setAttachedImageUrl(null);

    // If the assistant is busy (loading) or awaiting confirmation, queue the prompt.
    if (loading || pending || queue.length > 0) {
      setQueue((q) => [...q, text]);
      toast.message(`Queued (position ${queue.length + 1})`);
      return;
    }

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    messagesRef.current = next;
    await callBackend(next);
  };

  const approveAllQueue = () => {
    setQueueAutoApprove(true);
    setBulkMode(true);
    toast.success("Bulk approval on — queue will auto-run");
    // If currently awaiting confirmation, auto-approve it to keep moving.
    if (pending) {
      const action = pending;
      setPending(null);
      void callBackend(messagesRef.current, action, true);
    }
  };

  const clearQueue = () => {
    setQueue([]);
    setQueueAutoApprove(false);
    toast.message("Queue cleared");
  };

  const approve = async (autoRest = false) => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    if (autoRest) {
      setBulkMode(true);
      toast.success("Bulk mode on — remaining steps will auto-run");
    }
    await callBackend(messages, action, autoRest || bulkMode || queueAutoApprove);
  };

  const reject = () => {
    if (!pending) return;
    const next: Msg[] = [
      ...messages,
      { role: "tool", tool_call_id: pending.tool_call_id, content: JSON.stringify({ cancelled: true, reason: "User rejected the action." }) },
    ];
    setPending(null);
    setMessages(next);
    messagesRef.current = next;
    callBackend(next);
  };

  const onUpload = async (file: File) => {
    setAttaching(true);
    try {
      const { toWebpUnder250 } = await import("@/lib/imageToWebp");
      const webpFile = await toWebpUnder250(file).catch(() => file);
      const safeName = (webpFile.name || file.name).replace(/[^a-z0-9.-]/gi, "_");
      const path = `ai-uploads/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, webpFile, { contentType: webpFile.type });
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

  const visibleMessages = messages.filter((m) => m.role === "user" || (m.role === "assistant" && m.content));

  return (
    <div className={`flex flex-col bg-background ${embedded ? "h-[600px] max-h-[80vh]" : "h-[calc(100vh-8rem)]"} border border-border rounded-lg overflow-hidden`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Sparkles className="h-4 w-4" />
        <div className="flex-1">
          <div className="text-sm font-semibold uppercase tracking-wide">AI Agent</div>
          <div className="text-[11px] text-muted-foreground">Manage products in plain English · paste multiple prompts to queue them</div>
        </div>
        {bulkMode && (
          <button
            onClick={() => { setBulkMode(false); setQueueAutoApprove(false); toast.message("Bulk mode off"); }}
            className="text-[10px] uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-500/30 hover:bg-amber-500/25"
            title="Click to turn off auto-approve"
          >
            Bulk: ON
          </button>
        )}
        {(messages.length > 0 || queue.length > 0) && (
          <Button size="sm" variant="ghost" onClick={() => { setMessages([]); setPending(null); setBulkMode(false); setQueue([]); setQueueAutoApprove(false); }}>Clear</Button>
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
              <li>"Make a packing list PDF for today's pending orders"</li>
              <li>"Packing list for PO-101, PO-102, PO-103"</li>
              <li>"Packing list for all unshipped orders in Dhaka City"</li>

            </ul>
            <p className="text-xs pt-2">
              <strong className="text-foreground">Tip:</strong> press Enter to send. While the AI is working, any new prompt you Enter goes into the queue and runs in order. Use <em>Approve All Queue</em> to auto-run every step.
            </p>
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

      {queue.length > 0 && (
        <div className="border-t border-border bg-muted/30 px-4 py-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <ListChecks className="h-4 w-4" />
              Queue · {queue.length} pending
              {queueAutoApprove && <span className="text-[10px] text-amber-700 dark:text-amber-400 normal-case font-medium">(auto-approve on)</span>}
            </div>
            <div className="flex gap-2">
              {!queueAutoApprove && (
                <Button size="sm" variant="secondary" onClick={approveAllQueue} disabled={loading} className="h-7 text-[11px]">
                  <Check className="h-3 w-3 mr-1" /> Approve All Queue
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={clearQueue} className="h-7 text-[11px]">
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            </div>
          </div>
          <ol className="text-[11px] text-muted-foreground space-y-0.5 max-h-24 overflow-y-auto list-decimal pl-5">
            {queue.map((q, i) => (
              <li key={i} className="truncate" title={q}>{q.length > 120 ? q.slice(0, 120) + "…" : q}</li>
            ))}
          </ol>
        </div>
      )}

      {attachedImageUrl && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-2">
          <img src={attachedImageUrl} alt="" className="h-10 w-10 object-cover rounded" />
          <span className="text-xs flex-1 truncate">Image ready to attach</span>
          <Button size="sm" variant="ghost" onClick={() => setAttachedImageUrl(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="border-t border-border p-2 flex gap-2 items-end">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
        <Button size="icon" variant="outline" disabled={attaching || loading} onClick={() => fileRef.current?.click()} title="Upload image" className="shrink-0 h-[140px]">
          {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        <div
          className="relative flex-1"
          style={{ height: textareaHeight }}
        >
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startH = textareaHeight;
              const target = e.currentTarget;
              target.setPointerCapture(e.pointerId);
              const onMove = (ev: PointerEvent) => {
                const next = Math.min(600, Math.max(100, startH - (ev.clientY - startY)));
                setTextareaHeight(next);
              };
              const onUp = (ev: PointerEvent) => {
                target.releasePointerCapture(ev.pointerId);
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
              };
              window.addEventListener("pointermove", onMove);
              window.addEventListener("pointerup", onUp);
            }}
            title="Drag to resize"
            className="absolute top-1 right-1 z-10 h-4 w-4 cursor-ns-resize rounded-sm bg-muted hover:bg-muted-foreground/30 flex items-center justify-center select-none"
          >
            <div className="h-[2px] w-2 bg-foreground/60" />
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={loading || pending ? "Type next prompt and press Enter to queue…" : "Ask anything… press Enter to send (Shift+Enter for new line)"}
            disabled={false}
            className="h-full w-full resize-none leading-relaxed text-base pr-7"
          />
        </div>
        <Button onClick={send} disabled={!input.trim() && !attachedImageUrl} className="shrink-0 h-[140px]" title={loading || pending ? "Add to queue" : "Send"}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
