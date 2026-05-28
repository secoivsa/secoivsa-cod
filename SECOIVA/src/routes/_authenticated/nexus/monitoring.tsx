import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Radar, Activity, Bell, Zap, Users, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/monitoring")({
  component: MonitoringPage,
});

const SOURCE_COLOR: Record<string, string> = {
  crm: "text-cyan-400", projects: "text-primary", supply: "text-amber-400",
  production: "text-emerald-400", quality: "text-violet-400", safety: "text-red-400",
  finance: "text-yellow-400", hr: "text-pink-400", system: "text-muted-foreground",
};

const SEV_BG: Record<string, string> = {
  info: "bg-primary/15 text-primary",
  warning: "bg-amber-500/15 text-amber-300",
  critical: "bg-red-500/20 text-red-300",
};

function MonitoringPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(i);
  }, []);

  const { data } = useQuery({
    queryKey: ["monitoring", tick],
    refetchInterval: 10_000,
    queryFn: async () => {
      const since1h = new Date(Date.now() - 3600 * 1000).toISOString();
      const [events, alerts, profiles, activeProjects] = await Promise.all([
        supabase.from("system_events").select("id, source, event_type, title, severity, created_at, project_id")
          .order("created_at", { ascending: false }).limit(40),
        supabase.from("alerts").select("id, severity, title, source, created_at").eq("status", "activa")
          .order("created_at", { ascending: false }).limit(15),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }).in("status", ["en_curso", "planeacion"]),
      ]);

      const recent = (events.data ?? []).filter((e: any) => e.created_at >= since1h);
      const bySource: Record<string, number> = {};
      recent.forEach((e: any) => { bySource[e.source] = (bySource[e.source] ?? 0) + 1; });

      return {
        events: events.data ?? [],
        alerts: alerts.data ?? [],
        usersTotal: profiles.count ?? 0,
        activeProjects: activeProjects.count ?? 0,
        last1h: recent.length,
        bySource,
      };
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-2">
            <Radar className="h-3 w-3 text-primary animate-pulse" /> Realtime Monitoring
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">Centro de monitoreo global</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE · refresh 10s
        </div>
      </header>

      {/* Live stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Users} label="Usuarios en organización" value={data?.usersTotal ?? 0} />
        <Stat icon={Activity} label="Proyectos activos" value={data?.activeProjects ?? 0} />
        <Stat icon={Zap} label="Eventos última hora" value={data?.last1h ?? 0} accent="text-primary" />
        <Stat icon={Bell} label="Alertas activas" value={data?.alerts.length ?? 0}
              accent={(data?.alerts.length ?? 0) > 0 ? "text-amber-400" : ""} />
      </section>

      {/* Source breakdown */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-3">
          Actividad por módulo · última hora
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data?.bySource ?? {}).length === 0 && (
            <div className="text-xs text-muted-foreground">Sin actividad reciente.</div>
          )}
          {Object.entries(data?.bySource ?? {}).map(([src, n]) => (
            <div key={src} className={`px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-mono tracking-[0.15em] uppercase flex items-center gap-2 ${SOURCE_COLOR[src] ?? ""}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {src} · {n}
            </div>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Live timeline */}
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <header className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
              Flujo de eventos en vivo
            </span>
          </header>
          <ul className="divide-y divide-white/[0.04] max-h-[560px] overflow-y-auto">
            {(data?.events ?? []).map((ev: any) => (
              <li key={ev.id} className="px-5 py-3 hover:bg-white/[0.02] transition flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${SOURCE_COLOR[ev.source] ?? "text-muted-foreground"} bg-current shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-mono tracking-[0.2em] uppercase ${SOURCE_COLOR[ev.source] ?? ""}`}>{ev.source}</span>
                    <span className="text-[9px] font-mono text-muted-foreground/60">{ev.event_type}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase ${SEV_BG[ev.severity] ?? "bg-muted/20 text-muted-foreground"}`}>
                      {ev.severity}
                    </span>
                  </div>
                  <div className="text-sm mt-0.5 truncate">{ev.title}</div>
                </div>
                <time className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                  {new Date(ev.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </time>
              </li>
            ))}
            {(data?.events ?? []).length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">Sin eventos registrados.</li>
            )}
          </ul>
        </section>

        {/* Active alerts column */}
        <aside className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden h-fit">
          <header className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
              Alertas activas
            </span>
          </header>
          <ul className="divide-y divide-white/[0.04] max-h-[560px] overflow-y-auto">
            {(data?.alerts ?? []).map((a: any) => (
              <li key={a.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase ${SEV_BG[a.severity] ?? ""}`}>
                    {a.severity}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/60">{a.source}</span>
                </div>
                <div className="text-sm">{a.title}</div>
                <time className="text-[10px] font-mono text-muted-foreground/60">
                  {new Date(a.created_at).toLocaleString("es-MX")}
                </time>
              </li>
            ))}
            {(data?.alerts ?? []).length === 0 && (
              <li className="px-5 py-10 text-center text-xs text-muted-foreground">Sin alertas activas. ✓</li>
            )}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-4 w-4 ${accent ?? "text-primary"}`} />
      </div>
      <div className={`text-2xl font-semibold ${accent ?? ""}`}>{new Intl.NumberFormat("es-MX").format(value)}</div>
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
