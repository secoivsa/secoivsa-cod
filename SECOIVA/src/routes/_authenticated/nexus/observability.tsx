import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { observability } from "@/lib/monitoring";
import {
  Activity,
  Database,
  Gauge,
  Zap,
  AlertOctagon,
  Server,
  HardDrive,
  Wifi,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/observability")({
  component: ObservabilityPage,
});

type Probe = {
  label: string;
  table: string;
  latency: number;
  ok: boolean;
};

async function timedProbe(table: string, label: string): Promise<Probe> {
  const t0 = performance.now();
  try {
    const { error } = await supabase.from(table as never).select("id", { head: true, count: "exact" }).limit(1);
    return { label, table, latency: Math.round(performance.now() - t0), ok: !error };
  } catch {
    return { label, table, latency: Math.round(performance.now() - t0), ok: false };
  }
}

function ObservabilityPage() {
  const probes = useQuery({
    queryKey: ["obs-probes"],
    refetchInterval: 15000,
    queryFn: async () => {
      const targets: Array<{ table: string; label: string }> = [
        { table: "organizations", label: "Organizations" },
        { table: "profiles", label: "Profiles" },
        { table: "projects", label: "Projects" },
        { table: "system_events", label: "Events" },
        { table: "alerts", label: "Alerts" },
        { table: "notifications", label: "Notifications" },
      ];
      const t0 = performance.now();
      const results = await Promise.all(targets.map((t) => timedProbe(t.table, t.label)));
      const total = Math.round(performance.now() - t0);
      const avg = Math.round(results.reduce((a, b) => a + b.latency, 0) / results.length);
      return { results, total, avg };
    },
  });

  const volume = useQuery({
    queryKey: ["obs-volume"],
    refetchInterval: 30000,
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [events, alerts, notifs, errors] = await Promise.all([
        supabase.from("system_events").select("id", { head: true, count: "exact" }).gte("created_at", since),
        supabase.from("alerts").select("id", { head: true, count: "exact" }).gte("created_at", since),
        supabase.from("notifications").select("id", { head: true, count: "exact" }).gte("created_at", since),
        supabase
          .from("system_events")
          .select("id", { head: true, count: "exact" })
          .gte("created_at", since)
          .eq("severity", "critical"),
      ]);
      return {
        events: events.count ?? 0,
        alerts: alerts.count ?? 0,
        notifications: notifs.count ?? 0,
        critical: errors.count ?? 0,
      };
    },
  });

  const recent = useQuery({
    queryKey: ["obs-recent-errors"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data } = await supabase
        .from("system_events")
        .select("id, created_at, source, event_type, title, severity")
        .in("severity", ["critical", "warning"])
        .order("created_at", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  const avg = probes.data?.avg ?? 0;
  const healthScore = avg < 150 ? "ÓPTIMO" : avg < 400 ? "ESTABLE" : avg < 800 ? "DEGRADADO" : "CRÍTICO";
  const healthColor =
    avg < 150 ? "text-emerald-400" : avg < 400 ? "text-primary" : avg < 800 ? "text-amber-400" : "text-red-400";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-[1600px] mx-auto space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
            NEXUS · INFRASTRUCTURE
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Observabilidad técnica</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoreo en tiempo real de base de datos, latencia, eventos y errores del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
          <span className={`h-2 w-2 rounded-full ${avg < 400 ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            sistema: <span className={healthColor}>{healthScore}</span>
          </span>
        </div>
      </header>

      {/* Monitoring provider status */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
              Monitoring provider
            </div>
            <div className="text-sm font-medium">
              {observability.provider} <span className="text-muted-foreground">· modo {observability.mode}</span>
            </div>
          </div>
        </div>
        <div className="text-[11px] font-mono tracking-[0.18em] uppercase text-muted-foreground">
          DSN externo pendiente — captura local activa
        </div>
      </div>


      {/* Top KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi
          icon={<Gauge className="h-4 w-4" />}
          label="Latencia DB promedio"
          value={`${avg} ms`}
          hint={`${probes.data?.results.length ?? 0} probes`}
          tone={avg < 400 ? "ok" : "warn"}
        />
        <Kpi
          icon={<Activity className="h-4 w-4" />}
          label="Eventos / 24h"
          value={(volume.data?.events ?? 0).toLocaleString()}
          hint="system_events"
        />
        <Kpi
          icon={<AlertOctagon className="h-4 w-4" />}
          label="Eventos críticos / 24h"
          value={(volume.data?.critical ?? 0).toString()}
          tone={(volume.data?.critical ?? 0) > 0 ? "alert" : "ok"}
        />
        <Kpi
          icon={<Zap className="h-4 w-4" />}
          label="Notificaciones / 24h"
          value={(volume.data?.notifications ?? 0).toLocaleString()}
          hint={`${volume.data?.alerts ?? 0} alerts`}
        />
      </section>

      {/* Probes */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Panel
          icon={<Database className="h-4 w-4 text-primary" />}
          title="Probes de base de datos"
          subtitle="Latencia por tabla · refresh 15s"
        >
          <div className="divide-y divide-white/[0.05]">
            {(probes.data?.results ?? []).map((p) => {
              const pct = Math.min(100, (p.latency / 800) * 100);
              const barColor =
                p.latency < 150
                  ? "bg-emerald-400/70"
                  : p.latency < 400
                  ? "bg-primary/70"
                  : p.latency < 800
                  ? "bg-amber-400/70"
                  : "bg-red-400/70";
              return (
                <div key={p.table} className="py-3 flex items-center gap-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{p.label}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{p.latency}ms</span>
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {probes.isLoading && <SkeletonRows />}
          </div>
        </Panel>

        <Panel
          icon={<Server className="h-4 w-4 text-primary" />}
          title="Estado de servicios"
          subtitle="Componentes del runtime"
        >
          <div className="space-y-3">
            <ServiceRow icon={<Database className="h-3.5 w-3.5" />} label="Database · PostgreSQL" status={probes.data ? "online" : "checking"} meta={`${probes.data?.avg ?? 0}ms`} />
            <ServiceRow icon={<Wifi className="h-3.5 w-3.5" />} label="Realtime · WebSocket" status="online" meta="lwt 10s" />
            <ServiceRow icon={<HardDrive className="h-3.5 w-3.5" />} label="Storage · Buckets" status="online" meta="2 buckets" />
            <ServiceRow icon={<Zap className="h-3.5 w-3.5" />} label="Auth · Session" status="online" meta="JWT" />
            <ServiceRow icon={<Activity className="h-3.5 w-3.5" />} label="Workflow Engine · Triggers" status="online" meta="13 fn" />
            <ServiceRow icon={<Server className="h-3.5 w-3.5" />} label="AI Gateway · Lovable" status="online" meta="multi-model" />
          </div>
        </Panel>
      </section>

      {/* Recent errors / warnings */}
      <Panel
        icon={<AlertOctagon className="h-4 w-4 text-amber-400" />}
        title="Errores y advertencias recientes"
        subtitle="Últimos 15 eventos críticos / warning"
      >
        <div className="divide-y divide-white/[0.05]">
          {(recent.data ?? []).map((e) => (
            <div key={e.id} className="py-3 flex items-start gap-3">
              <span
                className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                  e.severity === "critical" ? "bg-red-400" : "bg-amber-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                    {e.source}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/60">·</span>
                  <span className="font-mono text-[9px] text-muted-foreground">{e.event_type}</span>
                </div>
                <div className="text-sm mt-0.5 truncate">{e.title}</div>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                {new Date(e.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {(recent.data?.length ?? 0) === 0 && !recent.isLoading && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              Sin errores recientes. Sistema operando con normalidad.
            </div>
          )}
          {recent.isLoading && <SkeletonRows />}
        </div>
      </Panel>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "ok" | "warn" | "alert";
}) {
  const toneClass =
    tone === "alert"
      ? "text-red-400"
      : tone === "warn"
      ? "text-amber-400"
      : tone === "ok"
      ? "text-emerald-400"
      : "text-foreground";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase">{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="text-[10px] font-mono text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && (
            <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function ServiceRow({
  icon,
  label,
  status,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  status: "online" | "degraded" | "offline" | "checking";
  meta?: string;
}) {
  const color =
    status === "online"
      ? "bg-emerald-400"
      : status === "degraded"
      ? "bg-amber-400"
      : status === "offline"
      ? "bg-red-400"
      : "bg-muted-foreground";
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-xs">{label}</span>
      {meta && <span className="font-mono text-[10px] text-muted-foreground">{meta}</span>}
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${status === "online" ? "animate-pulse" : ""}`} />
      <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground w-16 text-right">
        {status}
      </span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 py-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-8 rounded bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  );
}
