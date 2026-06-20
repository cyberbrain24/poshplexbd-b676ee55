import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PendingImage = { bucket: string; path: string; size?: number };

const convertStorageImageToWebpDataUrl = async (item: PendingImage): Promise<string> => {
  const { data, error } = await supabase.storage.from(item.bucket).download(item.path);
  if (error || !data) throw new Error(error?.message ?? "Could not download image");

  const objectUrl = URL.createObjectURL(data);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Browser could not decode this image"));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, img.naturalWidth || img.width);
    canvas.height = Math.max(1, img.naturalHeight || img.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser image converter is unavailable");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return await new Promise<string>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not encode WebP image"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Could not read WebP image"));
          reader.readAsDataURL(blob);
        },
        "image/webp",
        0.82,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

type Props = {
  targets?: PendingImage[];
  title?: string;
  description?: string;
  buttonLabel?: string;
  onDone?: () => void;
};

const ConvertImagesToWebpCard = ({ targets, title, description, buttonLabel, onDone }: Props) => {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [deleted, setDeleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

  const processOne = async (
    item: PendingImage,
  ): Promise<{ processed: number; deleted: number; errors: number }> => {
    try {
      const imageData = await convertStorageImageToWebpDataUrl(item);
      const result = await supabase.functions.invoke("convert-storage-to-webp", {
        body: { source: item, image_data: imageData },
      });
      if (result.error) throw result.error;
      return {
        processed: result.data?.processed ?? 0,
        deleted: result.data?.deleted ?? 0,
        errors: (result.data?.errors ?? []).length,
      };
    } catch (itemError: any) {
      await supabase.functions.invoke("convert-storage-to-webp", {
        body: { source: item, error: itemError?.message ?? "Browser conversion failed" },
      });
      return { processed: 0, deleted: 0, errors: 1 };
    }
  };

  const run = async () => {
    if (running) return;
    setRunning(true);
    setProcessed(0);
    setDeleted(0);
    setErrors(0);
    setDone(false);
    let totalProcessed = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    try {
      if (targets && targets.length > 0) {
        // Selected-only mode: skip the listing endpoint, hit each target directly.
        const items = targets.filter((t) => !t.path.toLowerCase().endsWith(".webp"));
        if (items.length === 0) {
          toast.info("All selected images are already WebP.");
          setDone(true);
          return;
        }
        for (const item of items) {
          const r = await processOne(item);
          totalProcessed += r.processed;
          totalDeleted += r.deleted;
          totalErrors += r.errors;
          setProcessed(totalProcessed);
          setDeleted(totalDeleted);
          setErrors(totalErrors);
        }
      } else {
        // Convert-all mode: poll the edge function for the next pending image.
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { data, error } = await supabase.functions.invoke(
            "convert-storage-to-webp",
            { body: { batch_size: 1 } },
          );
          if (error) throw error;

          const pending = (data?.pending ?? []) as PendingImage[];
          if (!data?.more || pending.length === 0) break;

          const r = await processOne(pending[0]);
          totalProcessed += r.processed;
          totalDeleted += r.deleted;
          totalErrors += r.errors;
          setProcessed(totalProcessed);
          setDeleted(totalDeleted);
          setErrors(totalErrors);
        }
      }
      setDone(true);
      toast.success(
        `Converted ${totalProcessed} image${totalProcessed === 1 ? "" : "s"} to WebP${totalErrors > 0 ? ` (${totalErrors} skipped)` : ""}`,
      );
      onDone?.();
    } catch (e: any) {
      toast.error(`Conversion failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  const targetCount = targets?.length ?? 0;
  const heading =
    title ?? (targets ? `Convert ${targetCount} selected image${targetCount === 1 ? "" : "s"} to WebP` : "Convert all images to WebP");
  const desc =
    description ??
    (targets
      ? "Re-encodes the selected non-WebP images as WebP, updates database references, and deletes the originals."
      : "One-time cleanup: re-encodes every existing JPG/PNG in storage as WebP, updates every reference in the database, and deletes the originals. New uploads are already WebP-only. Safe to close and resume — runs in small batches.");
  const cta = buttonLabel ?? "Run conversion";

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{heading}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
          {(running || processed > 0) && (
            <p className="text-xs text-muted-foreground">
              Converted {processed} · Deleted originals {deleted}
              {errors > 0 && ` · ${errors} skipped`}
              {done && " · done"}
            </p>
          )}
        </div>
        <Button onClick={run} disabled={running || (targets && targets.length === 0)} size="sm" variant="outline">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Working…
            </>
          ) : (
            <>
              <FileImage className="h-4 w-4 mr-2" />
              {cta}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConvertImagesToWebpCard;
