import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "pp_session_id";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

export function useVisitorTracking() {
  const location = useLocation();
  const lastPath = useRef<string>("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const path = location.pathname + location.search;

    // Skip admin and auth flows
    if (path.startsWith("/admin")) return;
    if (path === lastPath.current) return;
    lastPath.current = path;

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const session_id = getSessionId();
        let customer_id: string | null = null;
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user?.id) {
            const { data: ca } = await supabase
              .from("customer_accounts")
              .select("customer_id")
              .eq("auth_user_id", data.user.id)
              .maybeSingle();
            customer_id = ca?.customer_id ?? null;
          }
        } catch { /* ignore */ }

        await supabase.functions.invoke("track-visit", {
          body: {
            path,
            referrer: document.referrer || null,
            session_id,
            customer_id,
          },
        });

        // Heartbeat keeps "active" count alive
      } catch { /* ignore */ }
    }, 600);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [location.pathname, location.search]);

  // Heartbeat every 60s while on page (so "active visitors" stays accurate)
  useEffect(() => {
    const beat = window.setInterval(() => {
      const path = window.location.pathname + window.location.search;
      if (path.startsWith("/admin")) return;
      const session_id = getSessionId();
      supabase.functions.invoke("track-visit", {
        body: { path, referrer: document.referrer || null, session_id },
      }).catch(() => {});
    }, 60_000);
    return () => window.clearInterval(beat);
  }, []);
}
