import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { observability } from "@/lib/monitoring";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Cpu,
  Gauge,
  Layers,
  MonitorSmartphone,
  Network,
  RefreshCw,
  Route as RouteIcon,
  ShieldCheck,
  Wifi,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/qa")({
  component: QADashboard,
});

type Signal = "ok" | "warn" | "err" | "info";

function dot(s: Signal) {
  const c =
    s === "ok"
      ? "bg-emerald-400"
      : s === "warn"
        ? "bg-amber-400"
        : s === "err"
          ? "bg-red-400"
          : "bg-primary";
  return <span className={`h-2 w-2 rounded-full ${c} ${s !== "info" ? "animate-pulse" : ""}`} />;
}

function Card({
  title,
  icon: Icon,
  kind,
  children,
}: {
  title: string;
  icon: typeof Cpu;
  kind: Signal;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            {title}
          </h3>
        </div>
        {dot(kind)}
      </div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "err" | "default";
}) {
  const c =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "warn"
        ? "text-amber-400"
        : tone === "err"
          ? "text-red-400"
          : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-muted-foreground">
        {label}
      </span>
      <span className={`font-mono text-xs ${c}`}>{value}</span>
    </div>
  );
}

function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 0,
    h: typeof window !== "undefined" ? window.innerHeight : 0,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio : 1,
  }));
  useEffect(() => {
    const on = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);
  return online;
}

function QADashboard() {
  const router = useRouter();
  const qc = useQueryClient();
  const vp = useViewport();
  const online = useOnline();
  const [tick, setTick] = useState(0);

  // Real route map from the file-based router
  const routes = useMemo(() => {
    const all = Object.values(router.routesById ?? {}) as Array<{ id: string }>;
    const nexus = all.filter((r) => r.id?.startsWith("/_authenticated/nexus"));
    return { total: all.length, nexus: nexus.length };
  }, [router]);

  // Real DB reachability latency
  const dbPing = useQuery({
    queryKey: ["qa-db-ping", tick],
    queryFn: async () => {
      const t0 = performance.now();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      const ms = Math.round(performance.now() - t0);
      return { ms, ok: !error, error: error?.message };
    },
    staleTime: 15_000,
  });

  // Auth/session check
  const session = useQuery({
    queryKey: ["qa-session", tick],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      return { hasSession: !!data.session, error: error?.message };
    },
    staleTime: 30_000,
  });

  // Real buffered monitoring events
  const events = observability.getBufferedEvents();
  const errEvents = events.filter((e) => e.kind === "exception").length;
  const warnEvents = events.filter(
    (e) =>
      e.kind === "message" &&
      typeof (e.payload as { severity?: string })?.severity === "string" &&
      ["warning", "error", "fatal"].includes(
        (e.payload as { severity?: string }).severity!,
      ),
  ).length;

  // React Query cache state
  const cache = qc.getQueryCache().getAll();
  const staleQueries = cache.filter((q) => q.isStale()).length;
  const errorQueries = cache.filter((q) => q.state.status === "error").length;
  const fetchingQueries = cache.filter((q) => q.state.fetchStatus === "fetching").length;

  // Build mode
  const isProd = import.meta.env.PROD;
  const mode = import.meta.env.MODE;

  // Env validation (publishable client config)
  const env = {
    url: !!import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    project: !!import.meta.env.VITE_SUPABASE_PROJECT_ID,
  };
  const envOk = env.url && env.key && env.project;

  // Mobile safe-area detection
  const hasSafeArea =
    typeof CSS !== "undefined" &&
    CSS.supports?.("padding-top: env(safe-area-inset-top)");

  // Performance: navigation timing
  const nav =
    typeof performance !== "undefined"
      ? (performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined)
      : undefined;
  const ttfb = nav ? Math.round(nav.responseStart - nav.requestStart) : null;
  const domReady = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null;

  // Memory (Chrome only)
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } })
    .memory;
  const memPct = mem ? Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100) : null;

  // Enterprise score (0-100) — weighted average of real signals
  const checks = [
    { ok: dbPing.data?.ok === true, w: 18 },
    { ok: session.data?.hasSession === true, w: 10 },
    { ok: envOk, w: 12 },
    { ok: online, w: 10 },
    { ok: errorQueries === 0, w: 12 },
    { ok: errEvents === 0, w: 12 },
    { ok: isProd || mode === "development", w: 6 },
    { ok: routes.nexus >= 10, w: 8 },
    { ok: (dbPing.data?.ms ?? 9999) < 600, w: 6 },
    { ok: hasSafeArea, w: 3 },
    { ok: memPct === null ? true : memPct < 80, w: 3 },
  ];
  const totalW = checks.reduce((a, c) => a + c.w, 0);
  const gotW = checks.filter((c) => c.ok).reduce((a, c) => a + c.w, 0);
  const score = Math.round((gotW / totalW) * 100);
  const scoreTone: Signal = score >= 90 ? "ok" : score >= 70 ? "warn" : "err";

  const refresh = () => {
    setTick((t) => t + 1);
    qc.invalidateQueries();
  };

  return (
    <div className="px-6 lg:px-10 py-8 lg:py-10 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[0.35em] uppercase text-muted-foreground mb-2">
            NEXUS OS · QA · PRODUCTION READINESS
          </div>
          <h1 className="text-2xl lg:text-3xl font-light tracking-tight">
            Quality Assurance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análisis en tiempo real del estado técnico y de producción.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-white/10 hover:bg-white/[0.04] text-xs font-mono tracking-[0.2em] uppercase"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reanalizar
        </button>
      </div>

      {/* Enterprise score */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-primary/[0.04] to-white/[0.02] p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-2">
              Enterprise Score
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-light tabular-nums">{score}</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
              <span className="ml-3">{dot(scoreTone)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 max-w-md">
              Ponderado sobre arquitectura, seguridad, performance, UX y readiness.
              {dbPing.data?.ok === false ? " · DB no alcanzable." : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {([
              { k: "Architecture", v: routes.nexus >= 10 ? "OK" : "WARN", t: routes.nexus >= 10 ? "ok" : "warn" },
              { k: "Security", v: session.data?.hasSession ? "OK" : "WARN", t: session.data?.hasSession ? "ok" : "warn" },
              { k: "Performance", v: (dbPing.data?.ms ?? 9999) < 600 ? "OK" : "WARN", t: (dbPing.data?.ms ?? 9999) < 600 ? "ok" : "warn" },
              { k: "UX", v: hasSafeArea ? "OK" : "INFO", t: hasSafeArea ? "ok" : "info" },
              { k: "Scalability", v: errorQueries === 0 ? "OK" : "WARN", t: errorQueries === 0 ? "ok" : "warn" },
              { k: "Readiness", v: envOk ? "OK" : "ERR", t: envOk ? "ok" : "err" },
            ] as Array<{ k: string; v: string; t: Signal }>).map((b) => (
              <div
                key={b.k}
                className="rounded-md border border-white/[0.06] bg-black/20 px-3 py-2 flex items-center justify-between gap-3 min-w-[140px]"
              >
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
                  {b.k}
                </span>
                <span className="flex items-center gap-2">
                  {dot(b.t)}
                  <span className="font-mono">{b.v}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title="Build Health" icon={Layers} kind={envOk ? "ok" : "err"}>
          <Row label="Mode" value={mode} tone={isProd ? "ok" : "warn"} />
          <Row label="Production" value={isProd ? "yes" : "no"} tone={isProd ? "ok" : "warn"} />
          <Row label="Env · URL" value={env.url ? "ok" : "missing"} tone={env.url ? "ok" : "err"} />
          <Row label="Env · KEY" value={env.key ? "ok" : "missing"} tone={env.key ? "ok" : "err"} />
          <Row label="Env · PROJECT" value={env.project ? "ok" : "missing"} tone={env.project ? "ok" : "err"} />
        </Card>

        <Card title="Routing" icon={RouteIcon} kind={routes.nexus >= 10 ? "ok" : "warn"}>
          <Row label="Rutas totales" value={String(routes.total)} />
          <Row label="Rutas NEXUS" value={String(routes.nexus)} tone="ok" />
          <Row label="Ruta actual" value={router.state.location.pathname} />
        </Card>

        <Card title="Database" icon={Network} kind={dbPing.data?.ok ? "ok" : "err"}>
          <Row
            label="Reachable"
            value={dbPing.data?.ok ? "yes" : dbPing.isLoading ? "…" : "no"}
            tone={dbPing.data?.ok ? "ok" : "err"}
          />
          <Row
            label="Latencia"
            value={dbPing.data ? `${dbPing.data.ms} ms` : "—"}
            tone={(dbPing.data?.ms ?? 9999) < 300 ? "ok" : (dbPing.data?.ms ?? 9999) < 600 ? "warn" : "err"}
          />
          {dbPing.data?.error && <Row label="Error" value={dbPing.data.error} tone="err" />}
        </Card>

        <Card title="Sesión" icon={ShieldCheck} kind={session.data?.hasSession ? "ok" : "warn"}>
          <Row label="Sesión activa" value={session.data?.hasSession ? "yes" : "no"} tone={session.data?.hasSession ? "ok" : "warn"} />
          <Row label="Online" value={online ? "yes" : "no"} tone={online ? "ok" : "err"} />
        </Card>

        <Card title="React Query" icon={Boxes} kind={errorQueries === 0 ? "ok" : "warn"}>
          <Row label="Queries totales" value={String(cache.length)} />
          <Row label="Stale" value={String(staleQueries)} tone={staleQueries > 5 ? "warn" : "ok"} />
          <Row label="Fetching" value={String(fetchingQueries)} />
          <Row label="Con error" value={String(errorQueries)} tone={errorQueries === 0 ? "ok" : "err"} />
        </Card>

        <Card title="Runtime errors" icon={AlertTriangle} kind={errEvents === 0 ? "ok" : "err"}>
          <Row label="Exceptions" value={String(errEvents)} tone={errEvents === 0 ? "ok" : "err"} />
          <Row label="Warnings" value={String(warnEvents)} tone={warnEvents === 0 ? "ok" : "warn"} />
          <Row label="Buffer total" value={String(events.length)} />
          <Row label="Provider" value={observability.provider} />
        </Card>

        <Card title="Performance" icon={Gauge} kind={(ttfb ?? 0) < 400 ? "ok" : "warn"}>
          <Row label="TTFB" value={ttfb !== null ? `${ttfb} ms` : "—"} tone={(ttfb ?? 9999) < 400 ? "ok" : "warn"} />
          <Row label="DOM ready" value={domReady !== null ? `${domReady} ms` : "—"} />
          <Row label="JS heap" value={memPct !== null ? `${memPct}%` : "n/a"} tone={(memPct ?? 0) > 80 ? "warn" : "ok"} />
        </Card>

        <Card title="Mobile / Viewport" icon={MonitorSmartphone} kind={hasSafeArea ? "ok" : "info"}>
          <Row label="Viewport" value={`${vp.w}×${vp.h}`} />
          <Row label="DPR" value={String(vp.dpr)} />
          <Row label="Safe areas" value={hasSafeArea ? "soportadas" : "n/a"} tone={hasSafeArea ? "ok" : "warn"} />
          <Row label="Breakpoint" value={vp.w < 640 ? "mobile" : vp.w < 1024 ? "tablet" : "desktop"} />
        </Card>

        <Card title="Network" icon={Wifi} kind={online ? "ok" : "err"}>
          <Row label="Online" value={online ? "yes" : "no"} tone={online ? "ok" : "err"} />
          <Row
            label="Conexión"
            value={
              (navigator as unknown as { connection?: { effectiveType?: string } })?.connection
                ?.effectiveType ?? "n/a"
            }
          />
        </Card>
      </div>

      {/* Deployment checklist */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="text-[10px] font-mono tracking-[0.28em] uppercase text-muted-foreground">
            Deployment Checklist
          </h3>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {[
            { ok: envOk, label: "Variables públicas configuradas" },
            { ok: dbPing.data?.ok === true, label: "Base de datos alcanzable" },
            { ok: session.data?.hasSession === true, label: "Sesión auth válida" },
            { ok: errorQueries === 0, label: "Sin queries fallidas en cache" },
            { ok: errEvents === 0, label: "Sin excepciones runtime" },
            { ok: routes.nexus >= 10, label: "Módulos NEXUS registrados" },
            { ok: hasSafeArea, label: "Safe areas mobile soportadas" },
            { ok: (dbPing.data?.ms ?? 9999) < 600, label: "Latencia API < 600 ms" },
          ].map((it) => (
            <li
              key={it.label}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-black/20 border border-white/[0.04]"
            >
              {dot((it.ok ? "ok" : "warn") as Signal)}
              <span className={`text-xs ${it.ok ? "text-foreground" : "text-amber-300/90"}`}>
                {it.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
        <Activity className="h-3 w-3" />
        Análisis derivado del runtime real · sin mocks
      </div>
    </div>
  );
}
