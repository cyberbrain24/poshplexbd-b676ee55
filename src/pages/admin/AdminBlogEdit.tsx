import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBlogPostById, useCreateBlogPost, useUpdateBlogPost, useActiveBlogCategories } from "@/hooks/useBlog";
import { BlogPostInput, BlogPostStatus } from "@/types/blog";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const { data: existing, isLoading } = useBlogPostById(id);
  const { data: categories } = useActiveBlogCategories();
  const createMut = useCreateBlogPost();
  const updateMut = useUpdateBlogPost();

  const [form, setForm] = useState<BlogPostInput>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    cover_image_alt: "",
    status: "draft",
    author_name: "POSHPLEX",
    focus_keyword: "",
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    og_image_url: "",
    robots_index: true,
    category_ids: [],
  });
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt || "",
        content: existing.content || "",
        cover_image_url: existing.cover_image_url || "",
        cover_image_alt: existing.cover_image_alt || "",
        status: existing.status,
        author_name: existing.author_name,
        focus_keyword: existing.focus_keyword || "",
        meta_title: existing.meta_title || "",
        meta_description: existing.meta_description || "",
        canonical_url: existing.canonical_url || "",
        og_image_url: existing.og_image_url || "",
        robots_index: existing.robots_index,
        category_ids: (existing.categories || []).map((c) => c.id),
      });
      setSlugTouched(true);
    }
  }, [existing]);

  // Auto-slug from title for new posts
  useEffect(() => {
    if (!slugTouched && isNew) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, isNew]);

  const handleSave = async (status?: BlogPostStatus) => {
    const payload: BlogPostInput = { ...form, status: status || form.status };
    if (!payload.title.trim()) {
      alert("Title is required");
      return;
    }
    if (!payload.slug.trim()) payload.slug = slugify(payload.title);
    try {
      if (isNew) {
        const created = await createMut.mutateAsync(payload);
        navigate(`/admin/blog/edit/${created.id}`, { replace: true });
      } else {
        await updateMut.mutateAsync({ id: id!, input: payload });
      }
    } catch {}
  };

  const toggleCategory = (cid: string) => {
    setForm((f) => {
      const list = f.category_ids || [];
      return { ...f, category_ids: list.includes(cid) ? list.filter((x) => x !== cid) : [...list, cid] };
    });
  };

  const metaTitleLen = (form.meta_title || form.title).length;
  const metaDescLen = (form.meta_description || form.excerpt || "").length;

  if (!isNew && isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link to="/admin/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </Link>
        <div className="flex gap-2">
          {!isNew && form.status === "published" && (
            <a href={`/blog/${form.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" /> View</Button>
            </a>
          )}
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={createMut.isPending || updateMut.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          <Button onClick={() => handleSave("published")} disabled={createMut.isPending || updateMut.isPending}>
            Publish
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-bold tracking-tight uppercase">{isNew ? "New Post" : "Edit Post"}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" className="text-lg font-semibold" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => { setForm({ ...form, slug: slugify(e.target.value) }); setSlugTouched(true); }} placeholder="my-post-slug" />
                <p className="text-xs text-muted-foreground mt-1">URL: /blog/{form.slug || "..."}</p>
              </div>
              <div>
                <Label>Excerpt (short summary)</Label>
                <Textarea value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="A 1-2 sentence summary shown on listings and meta description fallback." />
              </div>
              <div>
                <Label>Content *</Label>
                <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Focus keyword</Label>
                <Input value={form.focus_keyword || ""} onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })} placeholder="streetwear bangladesh" />
              </div>
              <div>
                <Label>Meta title <span className="text-xs text-muted-foreground">({metaTitleLen}/60)</span></Label>
                <Input value={form.meta_title || ""} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} placeholder={form.title || "Falls back to post title"} maxLength={70} />
              </div>
              <div>
                <Label>Meta description <span className="text-xs text-muted-foreground">({metaDescLen}/160)</span></Label>
                <Textarea value={form.meta_description || ""} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} rows={2} maxLength={180} placeholder="Falls back to excerpt" />
              </div>
              <div>
                <Label>Canonical URL (optional)</Label>
                <Input value={form.canonical_url || ""} onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} placeholder="https://poshplexbd.com/blog/..." />
              </div>
              <div>
                <Label>OG image URL (optional)</Label>
                <Input value={form.og_image_url || ""} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="Falls back to cover image" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="robots_index" className="flex flex-col">
                  <span>Allow search engines to index this post</span>
                  <span className="text-xs text-muted-foreground font-normal">Off = noindex, nofollow</span>
                </Label>
                <Switch id="robots_index" checked={form.robots_index ?? true} onCheckedChange={(v) => setForm({ ...form, robots_index: v })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={form.status} onValueChange={(v: BlogPostStatus) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
              {form.status === "scheduled" && (
                <div>
                  <Label>Publish at</Label>
                  <Input type="datetime-local" value={form.published_at ? form.published_at.slice(0, 16) : ""} onChange={(e) => setForm({ ...form, published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                </div>
              )}
              <div>
                <Label>Author</Label>
                <Input value={form.author_name || ""} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Cover Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={form.cover_image_url || ""} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} placeholder="Image URL" />
              <Input value={form.cover_image_alt || ""} onChange={(e) => setForm({ ...form, cover_image_alt: e.target.value })} placeholder="Alt text (SEO + accessibility)" />
              {form.cover_image_url && (
                <img src={form.cover_image_url} alt={form.cover_image_alt || ""} className="w-full aspect-video object-cover rounded-md" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {(categories || []).length === 0 && (
                <p className="text-xs text-muted-foreground">No categories. <Link to="/admin/blog/categories" className="underline">Create one</Link>.</p>
              )}
              {(categories || []).map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(form.category_ids || []).includes(c.id)} onCheckedChange={() => toggleCategory(c.id)} />
                  <span>{c.name}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
