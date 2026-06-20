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

const TRACKED_PATHS_KEY = "pp_tracked_paths_v1";

function alreadyTracked(session_id: string, path: string): boolean {
  try {
    const raw = sessionStorage.getItem(TRACKED_PATHS_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    if (obj.sid !== session_id) return false;
    return Array.isArray(obj.paths) && obj.paths.includes(path);
  } catch {
    return false;
  }
}

function markTracked(session_id: string, path: string) {
  try {
    const raw = sessionStorage.getItem(TRACKED_PATHS_KEY);
    const obj = raw ? JSON.parse(raw) : { sid: session_id, paths: [] };
    if (obj.sid !== session_id) {
      obj.sid = session_id;
      obj.paths = [];
    }
    if (!obj.paths.includes(path)) obj.paths.push(path);
    // Cap at 200 to bound storage
    if (obj.paths.length > 200) obj.paths = obj.paths.slice(-200);
    sessionStorage.setItem(TRACKED_PATHS_KEY, JSON.stringify(obj));
  } catch { /* ignore */ }
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

    const session_id = getSessionId();
    // Dedupe: only track each path once per session
    if (alreadyTracked(session_id, path)) return;

    if (timer.current) window.clearTimeout(timer.current);
    const run = async () => {
      try {
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

        markTracked(session_id, path);

        await supabase.functions.invoke("track-visit", {
          body: {
            path,
            referrer: document.referrer || null,
            session_id,
            customer_id,
          },
        });
      } catch { /* ignore */ }
    };
    // Defer to idle so visit tracking never competes with the initial
    // paint or product fetches for HTTP connections.
    timer.current = window.setTimeout(() => {
      const ric = (window as any).requestIdleCallback as
        | ((cb: () => void, opts?: { timeout: number }) => number)
        | undefined;
      if (ric) ric(() => { void run(); }, { timeout: 4000 });
      else void run();
    }, 1200);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [location.pathname, location.search]);

}

