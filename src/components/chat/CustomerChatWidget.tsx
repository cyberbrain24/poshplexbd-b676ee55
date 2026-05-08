import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SESSION_KEY = "poshplex_chat_session";
const CONV_KEY = "poshplex_chat_conversation";
const HISTORY_KEY = "poshplex_chat_history";

const getSessionId = () => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const CustomerChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("Hi! How can I help you today?");
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const conversationIdRef = useRef<string | null>(localStorage.getItem(CONV_KEY));
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-customer-chat", handler);
    return () => window.removeEventListener("open-customer-chat", handler);
  }, []);

  useEffect(() => {
    supabase.from("chatbot_settings").select("welcome_message, enabled").maybeSingle().then(({ data }) => {
      if (data?.welcome_message) setWelcomeMessage(data.welcome_message);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("customer-chat", {
        body: {
          messages: next,
          sessionId: getSessionId(),
          conversationId: conversationIdRef.current,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I ran into an issue. Please try again." }]);
        return;
      }
      if (data?.conversationId) {
        conversationIdRef.current = data.conversationId;
        localStorage.setItem(CONV_KEY, data.conversationId);
      }
      setMessages((m) => [...m, { role: "assistant", content: data?.content || "..." }]);
    } catch (e) {
      console.error(e);
      toast.error("Chat unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const clearChat = () => {
    setMessages([]);
    conversationIdRef.current = null;
    localStorage.removeItem(CONV_KEY);
    localStorage.removeItem(HISTORY_KEY);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 bg-black/40" onClick={() => setOpen(false)}>
      <div
        className="w-full sm:w-[420px] h-[85vh] sm:h-[600px] bg-background border border-border flex flex-col rounded-t-2xl sm:rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-foreground text-background rounded-t-2xl sm:rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} />
            <span className="font-bold tracking-wide uppercase text-sm">POSHPLEX Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearChat} className="text-[10px] uppercase tracking-wider opacity-70 hover:opacity-100">
                Clear
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-md">
              {welcomeMessage}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-1">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-3 py-2 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        {messages.length === 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {["Show me new arrivals", "Track my order", "How do I place an order?"].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-[11px] px-2 py-1 border border-border rounded-full hover:bg-muted transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ask about products, orders…"
            className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-foreground text-background rounded-md disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="px-3 pb-2 text-[10px] text-muted-foreground text-center">
          Or <button onClick={() => { setOpen(false); navigate("/checkout"); }} className="underline">checkout normally</button> if you prefer.
        </div>
      </div>
    </div>
  );
};

export default CustomerChatWidget;
