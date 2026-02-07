import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Page, generateSlug, usePageMutations } from "@/hooks/usePages";
import { useSEOByPath, useSEOMutations } from "@/hooks/useSEO";
import SeoPreviewCard from "./SeoPreviewCard";
import DOMPurify from "dompurify";
import { FileText, Search, Settings, Eye, Bold, Italic, List, Link2 } from "lucide-react";

interface PageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: Page | null;
}

const PageModal = ({ open, onOpenChange, page }: PageModalProps) => {
  const { toast } = useToast();
  const { createPage, updatePage } = usePageMutations();
  const { upsertSEO } = useSEOMutations();
  const editorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    cover_image: "",
    status: "draft" as "draft" | "published" | "archived",
    page_type: "custom" as "system" | "custom",
  });

  const [seoData, setSeoData] = useState({
    meta_title: "",
    meta_description: "",
    focus_keywords: [] as string[],
    og_image: "",
  });

  const [autoSlug, setAutoSlug] = useState(true);
  const [keywordInput, setKeywordInput] = useState("");

  // Fetch existing SEO data
  const { data: existingSeo } = useSEOByPath(`/${formData.slug}`);

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content || "",
        excerpt: page.excerpt || "",
        cover_image: page.cover_image || "",
        status: page.status,
        page_type: page.page_type,
      });
      setAutoSlug(false);
    } else {
      setFormData({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        cover_image: "",
        status: "draft",
        page_type: "custom",
      });
      setAutoSlug(true);
    }
  }, [page, open]);

  // Load existing SEO data
  useEffect(() => {
    if (existingSeo) {
      setSeoData({
        meta_title: existingSeo.meta_title || "",
        meta_description: existingSeo.meta_description || "",
        focus_keywords: existingSeo.focus_keywords || [],
        og_image: existingSeo.og_image || "",
      });
    }
  }, [existingSeo]);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(prev.title),
      }));
    }
  }, [formData.title, autoSlug]);

  // Update editor content when switching to edit mode
  useEffect(() => {
    if (editorRef.current && formData.content) {
      editorRef.current.innerHTML = formData.content;
    }
  }, [open]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        content: editorRef.current?.innerHTML || "",
      }));
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorChange();
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !seoData.focus_keywords.includes(keywordInput.trim())) {
      setSeoData((prev) => ({
        ...prev,
        focus_keywords: [...prev.focus_keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setSeoData((prev) => ({
      ...prev,
      focus_keywords: prev.focus_keywords.filter((k) => k !== keyword),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Title and slug are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sanitize content before saving
      const sanitizedContent = DOMPurify.sanitize(formData.content, {
        ALLOWED_TAGS: [
          "h1", "h2", "h3", "h4", "h5", "h6",
          "p", "br", "strong", "em", "u", "s",
          "ul", "ol", "li", "a", "img",
          "blockquote", "pre", "code",
          "table", "thead", "tbody", "tr", "th", "td",
          "div", "span",
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "class", "style", "target"],
      });

      const pageData = {
        ...formData,
        content: sanitizedContent,
        is_protected: page?.is_protected || false,
        sort_order: page?.sort_order || 0,
        published_at: page?.published_at || null,
      };

      if (page) {
        await updatePage.mutateAsync({ id: page.id, ...pageData });
      } else {
        await createPage.mutateAsync(pageData);
      }

      // Save SEO data atomically
      if (seoData.meta_title || seoData.meta_description) {
        await upsertSEO.mutateAsync({
          page_path: `/${formData.slug}`,
          meta_title: seoData.meta_title || null,
          meta_description: seoData.meta_description || null,
          focus_keywords: seoData.focus_keywords.length > 0 ? seoData.focus_keywords : null,
          og_image: seoData.og_image || null,
          is_dynamic: false,
          entity_type: "page",
          json_ld_type: "WebPage",
        });
      }

      toast({
        title: page ? "Page Updated" : "Page Created",
        description: `"${formData.title}" has been ${page ? "updated" : "created"} successfully`,
      });

      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save page",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {page ? "Edit Page" : "Create New Page"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="About Us"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">URL Slug *</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="auto-slug" className="text-xs text-muted-foreground">
                        Auto
                      </Label>
                      <Switch
                        id="auto-slug"
                        checked={autoSlug}
                        onCheckedChange={setAutoSlug}
                        disabled={!!page}
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-1">/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }))
                      }
                      placeholder="about-us"
                      disabled={autoSlug && !page}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                  placeholder="A short description of this page..."
                  rows={2}
                />
              </div>

              {/* Rich Text Editor */}
              <div className="space-y-2">
                <Label>Content</Label>
                <div className="border rounded-lg overflow-hidden">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 p-2 bg-muted/50 border-b flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("bold")}
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("italic")}
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => execCommand("insertUnorderedList")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = prompt("Enter URL:");
                        if (url) execCommand("createLink", url);
                      }}
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Select
                      onValueChange={(value) => execCommand("formatBlock", value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">Paragraph</SelectItem>
                        <SelectItem value="h2">Heading 2</SelectItem>
                        <SelectItem value="h3">Heading 3</SelectItem>
                        <SelectItem value="h4">Heading 4</SelectItem>
                        <SelectItem value="blockquote">Quote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Editor Area */}
                  <div
                    ref={editorRef}
                    contentEditable
                    className="min-h-[200px] max-h-[300px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
                    onInput={handleEditorChange}
                    onBlur={handleEditorChange}
                    dangerouslySetInnerHTML={{ __html: formData.content }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 m-0">
              <SeoPreviewCard
                title={seoData.meta_title || formData.title}
                description={seoData.meta_description || formData.excerpt}
                url={`poshplexbd.lovable.app/${formData.slug}`}
              />

              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={seoData.meta_title}
                  onChange={(e) =>
                    setSeoData((prev) => ({ ...prev, meta_title: e.target.value }))
                  }
                  placeholder={formData.title}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  {seoData.meta_title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seoData.meta_description}
                  onChange={(e) =>
                    setSeoData((prev) => ({
                      ...prev,
                      meta_description: e.target.value,
                    }))
                  }
                  placeholder="Describe this page for search engines..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {seoData.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Focus Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddKeyword}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {seoData.focus_keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og_image">Social Share Image URL</Label>
                <Input
                  id="og_image"
                  value={seoData.og_image}
                  onChange={(e) =>
                    setSeoData((prev) => ({ ...prev, og_image: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 m-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Publication Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published" | "archived") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page_type">Page Type</Label>
                  <Select
                    value={formData.page_type}
                    onValueChange={(value: "system" | "custom") =>
                      setFormData((prev) => ({ ...prev, page_type: value }))
                    }
                    disabled={page?.is_protected}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Page</SelectItem>
                      <SelectItem value="system">System Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image URL</Label>
                <Input
                  id="cover_image"
                  value={formData.cover_image}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cover_image: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>

              {page?.is_protected && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    🔒 This is a protected system page and cannot be deleted.
                  </p>
                </div>
              )}

              {formData.status === "published" && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-700 rounded-lg">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm">
                    This page will be visible at:{" "}
                    <code className="bg-background px-1 rounded">/{formData.slug}</code>
                  </span>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPage.isPending || updatePage.isPending}
          >
            {createPage.isPending || updatePage.isPending
              ? "Saving..."
              : page
              ? "Update Page"
              : "Create Page"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PageModal;
