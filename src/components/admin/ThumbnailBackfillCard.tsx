import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Admin tool to backfill thumb_url + medium_url variants on existing
 * product_images rows. Polls the edge function in batches until the
 * remaining count reaches zero.
 */
const ThumbnailBackfillCard = () => {
  const [running, setRunning] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [errors, setErrors] = useState<number>(0);

  const run = async () => {
    if (running) return;
    setRunning(true);
    setProcessed(0);
    setErrors(0);
    let totalProcessed = 0;
    let totalErrors = 0;

    try {
      // Loop until remaining hits 0 (or we get back zero progress, which means
      // every remaining row is failing — bail out so we don't spin forever).
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await supabase.functions.invoke(
          "regenerate-image-thumbnails",
          { body: { batch_size: 10 } },
        );
        if (error) throw error;
        const batchProcessed = data?.processed ?? 0;
        const batchErrors = (data?.errors ?? []).length;
        totalProcessed += batchProcessed;
        totalErrors += batchErrors;
        setProcessed(totalProcessed);
        setErrors(totalErrors);
        setRemaining(data?.remaining ?? 0);

        if ((data?.remaining ?? 0) === 0) break;
        if (batchProcessed === 0) {
          // No forward progress — stop to avoid infinite loop on broken images.
          break;
        }
      }
      toast.success(
        `Regenerated ${totalProcessed} thumbnails${totalErrors > 0 ? ` (${totalErrors} skipped)` : ""}`,
      );
    } catch (e: any) {
      toast.error(`Thumbnail backfill failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Regenerate product image thumbnails</h3>
          <p className="text-xs text-muted-foreground">
            Builds 150 px (small), 300 px (medium), and 450 px (large) variants
            for older product images. Every variant is generated from the main
            image and shares its SEO metadata. New uploads already get them
            automatically.
          </p>
          {(running || processed > 0) && (
            <p className="text-xs text-muted-foreground">
              Processed {processed}
              {remaining !== null && ` · ${remaining} remaining`}
              {errors > 0 && ` · ${errors} skipped`}
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
              <RefreshCw className="h-4 w-4 mr-2" />
              Run backfill
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ThumbnailBackfillCard;
