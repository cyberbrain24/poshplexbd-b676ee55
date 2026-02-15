import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Tag, X } from "lucide-react";
import { generateSlug, MediaMetadata } from "@/services/media-metadata.service";
import { useUpsertMediaMetadata } from "@/hooks/useMediaMetadata";

interface MediaSeoEditorProps {
  bucketId: string;
  filePath: string;
  fileName: string;
  metadata: MediaMetadata | null;
}

const MediaSeoEditor = ({ bucketId, filePath, fileName, metadata }: MediaSeoEditorProps) => {
  const [displayName, setDisplayName] = useState("");
  const [seoSlug, setSeoSlug] = useState("");
  const [altText, setAltText] = useState("");
  const [titleAttr, setTitleAttr] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");

  const upsertMutation = useUpsertMediaMetadata();

  useEffect(() => {
    if (metadata) {
      setDisplayName(metadata.display_name || "");
      setSeoSlug(metadata.seo_slug || "");
      setAltText(metadata.alt_text || "");
      setTitleAttr(metadata.title_attribute || "");
      setMetaDesc(metadata.meta_description || "");
      setKeywords(metadata.keywords || []);
    } else {
      const nameWithoutExt = fileName.includes(".")
        ? fileName.split(".").slice(0, -1).join(".")
        : fileName;
      setDisplayName(nameWithoutExt);
      setSeoSlug(generateSlug(nameWithoutExt));
      setAltText("");
      setTitleAttr("");
      setMetaDesc("");
      setKeywords([]);
    }
  }, [metadata, fileName]);

  const handleAutoSlug = () => {
    setSeoSlug(generateSlug(displayName || fileName));
  };

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
    }
    setKeywordInput("");
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = () => {
    upsertMutation.mutate({
      bucket_id: bucketId,
      file_path: filePath,
      display_name: displayName || null,
      seo_slug: seoSlug || null,
      alt_text: altText || null,
      title_attribute: titleAttr || null,
      meta_description: metaDesc || null,
      keywords,
    });
  };

  return (
    <div className="space-y-4">
      <Separator />
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Tag className="h-4 w-4" />
        SEO & Metadata
      </h3>

      <div className="grid gap-3">
        <div>
          <Label htmlFor="display-name" className="text-xs">Display Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Human-readable file name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="seo-slug" className="text-xs">SEO Slug</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="seo-slug"
              value={seoSlug}
              onChange={(e) => setSeoSlug(e.target.value)}
              placeholder="url-friendly-name"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAutoSlug}>
              Auto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            URL-safe identifier. Must be unique across all files.
          </p>
        </div>

        <div>
          <Label htmlFor="alt-text" className="text-xs">Alt Text</Label>
          <Input
            id="alt-text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Describe the image for accessibility & SEO"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="title-attr" className="text-xs">Title Attribute</Label>
          <Input
            id="title-attr"
            value={titleAttr}
            onChange={(e) => setTitleAttr(e.target.value)}
            placeholder="Tooltip text on hover"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="meta-desc" className="text-xs">Meta Description</Label>
          <Textarea
            id="meta-desc"
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            placeholder="SEO description for this media file"
            rows={2}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {metaDesc.length}/160 characters
          </p>
        </div>

        <div>
          <Label className="text-xs">Keywords</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Add keyword"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddKeyword}>
              Add
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="gap-1 text-xs">
                  {kw}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveKeyword(kw)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full">
        {upsertMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Metadata
      </Button>
    </div>
  );
};

export default MediaSeoEditor;
