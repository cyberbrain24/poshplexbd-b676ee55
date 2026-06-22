import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function EmailUnsubscribe() {
  const [params] = useSearchParams();
  const [state, setState] = useState<"loading" | "done" | "invalid">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const e = params.get("e");
    if (!e) { setState("invalid"); return; }
    let decoded = "";
    try { decoded = atob(e); } catch { setState("invalid"); return; }
    if (!decoded.includes("@")) { setState("invalid"); return; }
    setEmail(decoded);
    supabase.rpc("public_unsubscribe_email", { p_email: decoded, p_reason: "unsubscribe" }).then(({ error }) => {
      setState(error ? "invalid" : "done");
    });
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center border border-border p-8 rounded">
        <h1 className="text-2xl font-bold uppercase tracking-tight mb-2">POSHPLEX</h1>
        {state === "loading" && <p className="text-muted-foreground">Processing…</p>}
        {state === "invalid" && <p className="text-destructive">Invalid unsubscribe link.</p>}
        {state === "done" && (
          <>
            <p className="text-base mb-2">You're unsubscribed.</p>
            <p className="text-sm text-muted-foreground break-all">{email} will no longer receive marketing emails from POSHPLEX.</p>
          </>
        )}
      </div>
    </div>
  );
}
