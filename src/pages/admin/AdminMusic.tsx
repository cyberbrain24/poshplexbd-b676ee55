import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Upload, Music as MusicIcon, Download } from "lucide-react";

interface Track {
  id: string;
  title: string;
  file_url: string;
  file_path: string;
  sort_order: number;
  is_active: boolean;
}

const AdminMusic = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("music_tracks")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setTracks((data || []) as Track[]);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error("Provide title and audio file");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "mp3";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("music").upload(path, file, {
        contentType: file.type || "audio/mpeg",
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("music").getPublicUrl(path);
      const { error: insErr } = await supabase.from("music_tracks").insert({
        title: title.trim(),
        file_url: pub.publicUrl,
        file_path: path,
        sort_order: tracks.length,
      });
      if (insErr) throw insErr;
      toast.success("Track uploaded");
      setTitle("");
      setFile(null);
      (document.getElementById("music-file") as HTMLInputElement | null)?.value && ((document.getElementById("music-file") as HTMLInputElement).value = "");
      load();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (t: Track) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await supabase.storage.from("music").remove([t.file_path]);
    const { error } = await supabase.from("music_tracks").delete().eq("id", t.id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  const toggleActive = async (t: Track) => {
    const { error } = await supabase.from("music_tracks").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <MusicIcon className="h-5 w-5" />
        <h1 className="text-xl md:text-2xl font-medium">Music Player</h1>
      </div>

      <div className="border border-border rounded-md p-4 mb-6 space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider">Upload Track</h2>
        <input
          type="text"
          placeholder="Track title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
        />
        <input
          id="music-file"
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm rounded-md disabled:opacity-50"
        >
          <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      <div className="border border-border rounded-md divide-y divide-border">
        {tracks.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground text-center">No tracks yet.</div>
        )}
        {tracks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3">
            <audio controls src={t.file_url} className="h-8 max-w-[260px]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
            </div>
            <label className="flex items-center gap-1 text-xs">
              <input type="checkbox" checked={t.is_active} onChange={() => toggleActive(t)} />
              Active
            </label>
            <button
              onClick={async () => {
                try {
                  const res = await fetch(t.file_url);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${t.title}.${(t.file_path.split(".").pop() || "mp3")}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error("Download failed");
                }
              }}
              className="p-2 hover:bg-muted rounded"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            <button onClick={() => handleDelete(t)} className="p-2 text-destructive hover:bg-muted rounded">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMusic;
