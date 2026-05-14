import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Pin, PinOff, Trash2, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  updated_at: string;
}

const COLORS = [
  { id: "default", cls: "bg-card" },
  { id: "yellow", cls: "bg-yellow-100 dark:bg-yellow-950/40" },
  { id: "blue", cls: "bg-blue-100 dark:bg-blue-950/40" },
  { id: "green", cls: "bg-green-100 dark:bg-green-950/40" },
  { id: "pink", cls: "bg-pink-100 dark:bg-pink-950/40" },
];

const colorClass = (id: string) => COLORS.find(c => c.id === id)?.cls ?? COLORS[0].cls;

export default function AdminNotes() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", content: "", color: "default" });
  const [creating, setCreating] = useState(false);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["admin_notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin_notes"] });

  const createMut = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("admin_notes").insert({
        title: draft.title, content: draft.content, color: draft.color, created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setCreating(false); setDraft({ title: "", content: "", color: "default" }); toast.success("Note added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Note> }) => {
      const { error } = await supabase.from("admin_notes").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Note deleted"); },
  });

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setDraft({ title: n.title, content: n.content, color: n.color });
  };

  const renderColorPicker = (selected: string, onPick: (c: string) => void) => (
    <div className="flex gap-1.5">
      {COLORS.map(c => (
        <button
          key={c.id}
          type="button"
          onClick={() => onPick(c.id)}
          className={cn("h-5 w-5 rounded-full border", c.cls, selected === c.id && "ring-2 ring-foreground ring-offset-1")}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick admin notes and reminders.</p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Note
          </Button>
        )}
      </div>

      {creating && (
        <Card className={cn("p-4 space-y-3", colorClass(draft.color))}>
          <Input
            placeholder="Title"
            value={draft.title}
            onChange={e => setDraft({ ...draft, title: e.target.value })}
            className="bg-background/60"
          />
          <Textarea
            placeholder="Write something..."
            value={draft.content}
            onChange={e => setDraft({ ...draft, content: e.target.value })}
            className="bg-background/60 min-h-[100px]"
          />
          <div className="flex items-center justify-between">
            {renderColorPicker(draft.color, c => setDraft({ ...draft, color: c }))}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setDraft({ title: "", content: "", color: "default" }); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => createMut.mutate()} disabled={createMut.isPending || (!draft.title && !draft.content)}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : notes.length === 0 && !creating ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No notes yet. Click "New Note" to add one.</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(n => (
            <Card key={n.id} className={cn("p-4 space-y-3 flex flex-col", colorClass(n.color))}>
              {editingId === n.id ? (
                <>
                  <Input
                    value={draft.title}
                    onChange={e => setDraft({ ...draft, title: e.target.value })}
                    className="bg-background/60"
                  />
                  <Textarea
                    value={draft.content}
                    onChange={e => setDraft({ ...draft, content: e.target.value })}
                    className="bg-background/60 min-h-[100px]"
                  />
                  <div className="flex items-center justify-between">
                    {renderColorPicker(draft.color, c => setDraft({ ...draft, color: c }))}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => updateMut.mutate({ id: n.id, patch: draft })}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-tight flex-1 cursor-pointer" onClick={() => startEdit(n)}>
                      {n.title || <span className="text-muted-foreground italic">Untitled</span>}
                    </h3>
                    <button
                      onClick={() => updateMut.mutate({ id: n.id, patch: { is_pinned: !n.is_pinned } })}
                      className="text-muted-foreground hover:text-foreground"
                      title={n.is_pinned ? "Unpin" : "Pin"}
                    >
                      {n.is_pinned ? <Pin className="h-4 w-4 fill-current" /> : <PinOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <p
                    className="text-sm whitespace-pre-wrap flex-1 cursor-pointer text-muted-foreground"
                    onClick={() => startEdit(n)}
                  >
                    {n.content || <span className="italic">Empty</span>}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.updated_at), { addSuffix: true })}
                    </span>
                    <button
                      onClick={() => { if (confirm("Delete this note?")) deleteMut.mutate(n.id); }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
