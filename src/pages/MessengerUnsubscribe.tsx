import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function MessengerUnsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "done" | "invalid">("loading");
  const [id, setId] = useState("");

  useEffect(() => {
    const v = (params.get("id") || params.get("psid") || "").trim();
    if (!v) { setState("invalid"); return; }
    setId(v);
    supabase.from("msgr_suppression").insert({ psid: v, reason: "unsubscribe", source: "public" }).then(() => setState("done"));
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center border border-border p-8 rounded">
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">POSHPLEX</h1>
        {state === "loading" && <p className="text-muted-foreground">Processing…</p>}
        {state === "invalid" && <p className="text-destructive">Invalid opt-out link.</p>}
        {state === "done" && (
          <>
            <p className="text-base mb-2">You're opted out.</p>
            <p className="text-sm text-muted-foreground break-all">{id} will no longer receive Messenger messages from POSHPLEX.</p>
          </>
        )}
      </div>
    </div>
  );
}
