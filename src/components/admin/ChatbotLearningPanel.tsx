import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2, Trash2, BookOpen, Brain, Wand2 } from "lucide-react";

type Learning = {
  id: string;
  kind: "rule" | "style" | "insight";
  content: string;
  is_active: boolean;
  created_at: string;
  source: any;
};

type Run = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "succeeded" | "failed";
  conversations_analyzed: number;
  learnings_added: number;
  faqs_added: number;
  summary: any;
  error: string | null;
};

export default function ChatbotLearningPanel() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: learnings = [] } = useQuery({
    queryKey: ["chatbot-learnings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_learnings" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Learning[];
    },
  });

  const { data: runs = [] } = useQuery({
    queryKey: ["chatbot-learning-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_learning_runs" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as Run[];
    },
  });

  const runLearning = async () => {
    if (running) return;
    setRunning(true);
    const t = toast.loading("Analyzing conversations and updating knowledge…");
    try {
      const { data, error } = await supabase.functions.invoke("chatbot-learn");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        `Learned ${data.learnings_added} rule(s) + ${data.faqs_added} FAQ(s) from ${data.conversations_analyzed} chats`,
        { id: t },
      );
      qc.invalidateQueries({ queryKey: ["chatbot-learnings"] });
      qc.invalidateQueries({ queryKey: ["chatbot-learning-runs"] });
      qc.invalidateQueries({ queryKey: ["chatbot-faqs"] });
    } catch (e: any) {
      toast.error(e?.message || "Learning run failed", { id: t });
    } finally {
      setRunning(false);
    }
  };

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("chatbot_learnings" as any)
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chatbot-learnings"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chatbot_learnings" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chatbot-learnings"] });
      toast.success("Removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rules = learnings.filter((l) => l.kind === "rule");
  const styles = learnings.filter((l) => l.kind === "style");
  const lastRun = runs[0];

  return (
    <div className="space-y-4">
      {/* Header / Run */}
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Brain className="h-4 w-4" /> Behavior Learning
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Mines recent customer chats, your curated FAQs, and product/order signals to extract
              new behavior rules, tone notes, and FAQ entries. Auto-applied with full audit log —
              you can disable any item below at any time.
            </p>
          </div>
          <Button onClick={runLearning} disabled={running} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {running ? "Learning…" : "Run Learning Now"}
          </Button>
        </div>

        {lastRun && (
          <div className="text-[11px] text-muted-foreground border-t border-border pt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>Last run: {new Date(lastRun.started_at).toLocaleString()}</span>
            <span>Status: <Badge variant={lastRun.status === "succeeded" ? "default" : lastRun.status === "failed" ? "destructive" : "secondary"}>{lastRun.status}</Badge></span>
            <span>Chats analyzed: {lastRun.conversations_analyzed}</span>
            <span>+{lastRun.learnings_added} rules</span>
            <span>+{lastRun.faqs_added} FAQs</span>
            {lastRun.error && <span className="text-destructive">Error: {lastRun.error}</span>}
          </div>
        )}
      </Card>

      {/* Behavior rules */}
      <Card className="p-4 space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wider flex items-center gap-2">
          <Wand2 className="h-4 w-4" /> Behavior Rules ({rules.length})
        </h4>
        {rules.length === 0 ? (
          <p className="text-xs text-muted-foreground">No rules yet. Click "Run Learning Now" to extract some.</p>
        ) : (
          <ul className="space-y-2">
            {rules.map((l) => (
              <li key={l.id} className="flex items-start gap-3 p-2 border border-border rounded-md">
                <Switch checked={l.is_active} onCheckedChange={(v) => toggle.mutate({ id: l.id, is_active: v })} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${l.is_active ? "" : "opacity-50 line-through"}`}>{l.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(l.created_at).toLocaleDateString()}
                    {l.source?.conversations_analyzed != null && ` · from ${l.source.conversations_analyzed} chats`}
                  </p>
                </div>
                <button
                  onClick={() => confirm("Delete this rule?") && remove.mutate(l.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Style notes */}
      <Card className="p-4 space-y-3">
        <h4 className="font-medium text-sm uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-4 w-4" /> Tone &amp; Style ({styles.length})
        </h4>
        {styles.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tone notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {styles.map((l) => (
              <li key={l.id} className="flex items-start gap-3 p-2 border border-border rounded-md">
                <Switch checked={l.is_active} onCheckedChange={(v) => toggle.mutate({ id: l.id, is_active: v })} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${l.is_active ? "" : "opacity-50 line-through"}`}>{l.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(l.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => confirm("Delete this note?") && remove.mutate(l.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Run history */}
      <Card className="p-4 space-y-2">
        <h4 className="font-medium text-sm uppercase tracking-wider">Run History</h4>
        {runs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-1.5 pr-3">When</th>
                  <th className="py-1.5 pr-3">Status</th>
                  <th className="py-1.5 pr-3">Chats</th>
                  <th className="py-1.5 pr-3">Rules+</th>
                  <th className="py-1.5 pr-3">FAQs+</th>
                  <th className="py-1.5">Notes</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 whitespace-nowrap">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="py-1.5 pr-3">
                      <Badge variant={r.status === "succeeded" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-1.5 pr-3">{r.conversations_analyzed}</td>
                    <td className="py-1.5 pr-3">{r.learnings_added}</td>
                    <td className="py-1.5 pr-3">{r.faqs_added}</td>
                    <td className="py-1.5 text-muted-foreground truncate max-w-[280px]">{r.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
