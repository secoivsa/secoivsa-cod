import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { monitoring } from "@/lib/monitoring";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 min
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"];

/**
 * Inactivity-based forced logout. Mounted once in the authenticated shell.
 * On timeout: revokes the current Supabase session and redirects to /login.
 */
export function useInactivityTimeout(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
  const nav = useNavigate();
  const lastActivity = useRef<number>(Date.now());

  useEffect(() => {
    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const interval = window.setInterval(async () => {
      if (Date.now() - lastActivity.current >= timeoutMs) {
        monitoring.captureMessage({
          message: "session.inactivity_timeout",
          severity: "warning",
          context: { timeoutMs },
        });
        try {
          await supabase.auth.signOut();
        } finally {
          nav({ to: "/login", replace: true });
        }
      }
    }, 30_000);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(interval);
    };
  }, [timeoutMs, nav]);
}

/** Records the current browser session in login_sessions (best-effort, idempotent). */
export async function recordLoginSession(userId: string, orgId: string) {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    const device = inferDevice(ua ?? "");
    await supabase.from("login_sessions").insert({
      user_id: userId,
      organization_id: orgId,
      user_agent: ua,
      device_label: device,
    });
  } catch (e) {
    monitoring.captureException(e, { source: "session.recordLoginSession" });
  }
}

function inferDevice(ua: string): string {
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  return "Desktop";
}
