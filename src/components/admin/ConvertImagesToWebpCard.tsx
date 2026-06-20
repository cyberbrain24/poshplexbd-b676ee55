import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * One-time backfill: convert every existing non-WebP storage file to WebP,
 * rewrite every DB reference, delete the original. Polls
 * the edge function in small batches until no more pending files remain.
 */
const ConvertImagesToWebpCard = () => {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [deleted, setDeleted] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);

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
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase.functions.invoke(
          "convert-storage-to-webp",
          { body: { batch_size: 5 } },
        );
        if (error) throw error;
        const batchProcessed = data?.processed ?? 0;
        const batchDeleted = data?.deleted ?? 0;
        const batchErrors = (data?.errors ?? []).length;
        totalProcessed += batchProcessed;
        totalDeleted += batchDeleted;
        totalErrors += batchErrors;
        setProcessed(totalProcessed);
        setDeleted(totalDeleted);
        setErrors(totalErrors);

        if (!data?.more) break;
        if (batchProcessed === 0 && batchErrors === 0) break; // no progress
      }
      setDone(true);
      toast.success(
        `Converted ${totalProcessed} images to WebP${totalErrors > 0 ? ` (${totalErrors} skipped)` : ""}`,
      );
    } catch (e: any) {
      toast.error(`Conversion failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Convert all images to WebP</h3>
          <p className="text-xs text-muted-foreground">
            One-time cleanup: re-encodes every existing JPG/PNG in storage as WebP,
            updates every reference in the database, and deletes the originals. New uploads are
            already WebP-only. Safe to close and resume — runs in small batches.
          </p>
          {(running || processed > 0) && (
            <p className="text-xs text-muted-foreground">
              Converted {processed} · Deleted originals {deleted}
              {errors > 0 && ` · ${errors} skipped`}
              {done && " · done"}
            </p>
          )}
        </div>
        <Button onClick={run} disabled={running} size="sm" variant="outline">
          {running ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Working…
            </>
          ) : (
            <>
              <FileImage className="h-4 w-4 mr-2" />
              Run conversion
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConvertImagesToWebpCard;
