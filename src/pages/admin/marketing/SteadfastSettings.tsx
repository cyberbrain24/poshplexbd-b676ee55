import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, MapPin } from "lucide-react";
import { useSteadfastBalance, useSyncLocationsFromSteadfast } from "@/hooks/useSteadfast";

/**
 * Steadfast API settings page.
 *
 * The Steadfast credentials (STEADFAST_API_KEY and STEADFAST_SECRET_KEY) are
 * stored as backend secrets and consumed by the `steadfast-courier` edge function.
 * This page surfaces credential health (via a balance ping), lets admins re-test
 * the connection, and provides quick actions like syncing Districts/Thanas.
 */
const SteadfastSettings = () => {
  const balance = useSteadfastBalance();
  const syncLocations = useSyncLocationsFromSteadfast();
  const [tested, setTested] = useState(false);

  const handleTest = async () => {
    setTested(true);
    await balance.refetch();
  };

  const configured = balance.data && !balance.error && typeof balance.data?.current_balance !== "undefined";
  const hasError = tested && (balance.error || (balance.data && !configured));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Steadfast Courier API</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure and verify the Steadfast Courier integration used for shipment creation, tracking,
          balance, returns, and location sync.
        </p>
      </div>

      {/* Connection status */}
      <section className="border border-border p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-medium">Connection Status</h3>
        </div>

        <div className="border border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {balance.isFetching ? (
              <Skeleton className="h-4 w-4 rounded-full" />
            ) : configured ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : hasError ? (
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">Steadfast Courier Ltd.</p>
              <p className="text-xs text-muted-foreground truncate">
                {balance.isFetching
                  ? "Testing connection…"
                  : configured
                  ? `Connected · Current balance: ৳${Number(balance.data.current_balance).toLocaleString("en-BD")}`
                  : hasError
                  ? "Connection failed. Verify STEADFAST_API_KEY and STEADFAST_SECRET_KEY."
                  : "Click \"Test Connection\" to verify credentials."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-none shrink-0"
            onClick={handleTest}
            disabled={balance.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${balance.isFetching ? "animate-spin" : ""}`} />
            Test Connection
          </Button>
        </div>
      </section>

      {/* Credentials info */}
      <section className="border border-border p-6 space-y-3">
        <h3 className="text-base font-medium">API Credentials</h3>
        <p className="text-xs text-muted-foreground">
          Credentials are stored as backend secrets (not in the database) and consumed by the{" "}
          <span className="font-mono">steadfast-courier</span> edge function. Two secrets are required:
        </p>
        <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
          <li>
            <span className="font-mono">STEADFAST_API_KEY</span> — your Api-Key from the Steadfast merchant portal.
          </li>
          <li>
            <span className="font-mono">STEADFAST_SECRET_KEY</span> — the matching Secret-Key.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          To rotate or set these, use the project Backend → Secrets panel. Generate keys from the
          Steadfast merchant dashboard at{" "}
          <a
            href="https://steadfast.com.bd/user/login"
            target="_blank"
            rel="noopener"
            className="underline inline-flex items-center gap-1"
          >
            steadfast.com.bd <ExternalLink className="h-3 w-3" />
          </a>
          .
        </p>
      </section>

      {/* Actions */}
      <section className="border border-border p-6 space-y-4">
        <h3 className="text-base font-medium">Quick Actions</h3>

        <div className="border border-border p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Sync Districts & Thanas</p>
              <p className="text-xs text-muted-foreground truncate">
                Refresh the location list from Steadfast's coverage API.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-none shrink-0"
            onClick={() => syncLocations.mutate()}
            disabled={syncLocations.isPending}
          >
            {syncLocations.isPending ? "Syncing…" : "Sync Locations"}
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SteadfastSettings;
