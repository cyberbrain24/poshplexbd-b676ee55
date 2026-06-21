import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PendingImage } from "./ConvertImagesToWebpCard";

const VARIANTS = [
  { folder: "thumbs", width: 150, quality: 0.7, column: "thumb_url" },
  { folder: "medium", width: 300, quality: 0.74, column: "medium_url" },
  { folder: "large", width: 450, quality: 0.8, column: "large_url" },
] as const;

const splitPath = (path: string): { dir: string; stem: string } => {
  const slash = path.lastIndexOf("/");
  const file = slash === -1 ? path : path.slice(slash + 1);
  const dir = slash === -1 ? "" : path.slice(0, slash);
  const dot = file.lastIndexOf(".");
  const stem = dot === -1 ? file : file.slice(0, dot);
  return { dir, stem };
};

const decodeImageFromBucket = async (item: PendingImage): Promise<HTMLImageElement> => {
  const { data, error } = await supabase.storage.from(item.bucket).download(item.path);
  if (error || !data) throw new Error(error?.message ?? "Could not download image");
  const objectUrl = URL.createObjectURL(data);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Browser could not decode this image"));
      img.src = objectUrl;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }
};

const renderVariantBlob = (img: HTMLImageElement, width: number, quality: number): Promise<Blob> => {
  const scale = width / img.naturalWidth;
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Browser image converter is unavailable");
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode WebP variant"))),
      "image/webp",
      quality,
    );
  });
};

type Props = {
  targets: PendingImage[];
  onDone?: () => void;
};

const GenerateThumbnailsCard = ({ targets, onDone }: Props) => {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

  const processOne = async (item: PendingImage) => {
    const img = await decodeImageFromBucket(item);
    const { dir, stem } = splitPath(item.path);
    const baseDir = dir ? `${dir}/` : "";

    // Look up the matching product_images row (only for product-images bucket)
    const { data: publicData } = supabase.storage.from(item.bucket).getPublicUrl(item.path);
    const sourcePublicUrl = publicData.publicUrl;

    const updates: Record<string, string> = {};
    let made = 0;

    for (const spec of VARIANTS) {
      try {
        const blob = await renderVariantBlob(img, spec.width, spec.quality);
        const path = `${baseDir}${spec.folder}/${stem}-${spec.width}.webp`;
        const { error } = await supabase.storage
          .from(item.bucket)
          .upload(path, blob, { contentType: "image/webp", upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(item.bucket).getPublicUrl(path);
        updates[spec.column] = urlData.publicUrl;
        made++;
      } catch (e) {
        console.warn(`[thumb-gen] ${spec.folder} failed for ${item.path}`, e);
      }
    }

    // Sync product_images row when source is a product image
    if (item.bucket === "product-images" && Object.keys(updates).length > 0) {
      try {
        await supabase
          .from("product_images")
          .update(updates)
          .eq("image_url", sourcePublicUrl);
      } catch (e) {
        console.warn("[thumb-gen] DB sync failed", e);
      }
    }

    return made;
  };

  const run = async () => {
    if (running || targets.length === 0) return;
    setRunning(true);
    setProcessed(0);
    setGenerated(0);
    setErrors(0);
    setDone(false);
    let p = 0;
    let g = 0;
    let e = 0;
    try {
      for (const item of targets) {
        try {
          const made = await processOne(item);
          g += made;
          p++;
        } catch (err) {
          console.error("Thumbnail generation failed for", item.path, err);
          e++;
        }
        setProcessed(p);
        setGenerated(g);
        setErrors(e);
      }
      setDone(true);
      toast.success(
        `Generated ${g} thumbnail${g === 1 ? "" : "s"} across ${p} image${p === 1 ? "" : "s"}${e > 0 ? ` (${e} failed)` : ""}`,
      );
      onDone?.();
    } catch (err: any) {
      toast.error(`Thumbnail generation failed: ${err?.message ?? "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  const count = targets.length;
  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">
            Generate thumbnails for {count} selected image{count === 1 ? "" : "s"}
          </h3>
          <p className="text-xs text-muted-foreground">
            Builds 150 / 300 / 450 px WebP variants from each main image. Existing
            thumbnails are overwritten so the set stays in sync.
          </p>
          {(running || processed > 0) && (
            <p className="text-xs text-muted-foreground">
              Processed {processed}/{count} · {generated} thumbnails written
              {errors > 0 && ` · ${errors} failed`}
              {done && " · done"}
            </p>
          )}
        </div>
        <Button onClick={run} disabled={running || count === 0} size="sm" variant="outline">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Working…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Run generation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GenerateThumbnailsCard;
