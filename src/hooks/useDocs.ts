import { useEffect, useState, useMemo } from "react";

export interface DocMeta {
  slug: string;
  title: string;
  category: string;
  order: number;
  updated: string;
}

export interface Doc extends DocMeta {
  body: string;
}

// Lazy-load each markdown as its own chunk.
const modules = import.meta.glob("../content/docs/*.md", {
  query: "?raw",
  import: "default",
}) as Record<string, () => Promise<string>>;

function parseFrontMatter(raw: string): { meta: Partial<DocMeta>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    meta[key] = value;
  });
  return {
    meta: {
      title: meta.title,
      category: meta.category,
      order: meta.order ? Number(meta.order) : 999,
      updated: meta.updated,
    } as Partial<DocMeta>,
    body: match[2],
  };
}

function slugFromPath(path: string): string {
  const name = path.split("/").pop()!.replace(/\.md$/, "");
  return name.replace(/^\d+-/, "");
}

let cachedIndex: DocMeta[] | null = null;

export function useDocsIndex() {
  const [docs, setDocs] = useState<DocMeta[] | null>(cachedIndex);
  const [loading, setLoading] = useState(!cachedIndex);

  useEffect(() => {
    if (cachedIndex) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        Object.entries(modules).map(async ([path, loader]) => {
          const raw = await loader();
          const { meta } = parseFrontMatter(raw);
          return {
            slug: slugFromPath(path),
            title: meta.title || slugFromPath(path),
            category: meta.category || "General",
            order: meta.order ?? 999,
            updated: meta.updated || "",
          } as DocMeta;
        })
      );
      entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
      cachedIndex = entries;
      if (!cancelled) {
        setDocs(entries);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<string, DocMeta[]>();
    (docs || []).forEach((d) => {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category)!.push(d);
    });
    return Array.from(map.entries());
  }, [docs]);

  return { docs: docs || [], byCategory, loading };
}

export function useDoc(slug: string | undefined) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const entry = Object.entries(modules).find(([p]) => slugFromPath(p) === slug);
    if (!entry) {
      setError("Document not found");
      setLoading(false);
      return;
    }
    entry[1]()
      .then((raw) => {
        const { meta, body } = parseFrontMatter(raw);
        if (cancelled) return;
        setDoc({
          slug,
          title: meta.title || slug,
          category: meta.category || "General",
          order: meta.order ?? 999,
          updated: meta.updated || "",
          body,
        });
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message || e));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { doc, loading, error };
}
