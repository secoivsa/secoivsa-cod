import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Eye, ShieldCheck, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/alerts")({
  component: AlertsPage,
});

type Alert = {
  id: string;
  source: string;
  severity: "info" | "warning" | "critical";
  status: "activa" | "reconocida" | "resuelta";
  title: string;
  description: string | null;
  link: string | null;
  project_id: string | null;
  entity_table: string | null;
  created_at: string;
};

const SEV_META: Record<string, { color: string; icon: typeof Info; label: string; ring: string }> = {
  critical: { color: "text-red-300",     icon: AlertOctagon,   label: "Crítica", ring: "border-red-500/30 bg-red-500/[0.06]" },
  warning:  { color: "text-amber-300",   icon: AlertTriangle,  label: "Atención", ring: "border-amber-500/30 bg-amber-500/[0.06]" },
  info:     { color: "text-blue-300",    icon: Info,           label: "Info",    ring: "border-blue-500/30 bg-blue-500/[0.06]" },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`;
  return `hace ${Math.floor(s / 86400)}d`;
}

function AlertsPage() {
  const qc = useQueryClient();
  const [sevFilter, setSevFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [statusFilter, setStatusFilter] = useState<"activa" | "reconocida" | "resuelta" | "all">("activa");

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts", statusFilter],
    refetchInterval: 20_000,
    queryFn: async () => {
      let q = supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
  });

  const filtered = useMemo(
    () => (sevFilter === "all" ? alerts : alerts.filter((a) => a.severity === sevFilter)),
    [alerts, sevFilter]
  );

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0, total: alerts.length };
    alerts.forEach((a) => { c[a.severity]++; });
    return c;
  }, [alerts]);

  async function update(id: string, status: Alert["status"]) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const now = new Date().toISOString();
    if (status === "reconocida") {
      await supabase.from("alerts").update({ status, acknowledged_by: userId, acknowledged_at: now }).eq("id", id);
    } else if (status === "resuelta") {
      await supabase.from("alerts").update({ status, resolved_by: userId, resolved_at: now }).eq("id", id);
    } else {
      await supabase.from("alerts").update({ status }).eq("id", id);
    }
    qc.invalidateQueries({ queryKey: ["alerts"] });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.35em] uppercase text-muted-foreground mb-1">
            NEXUS · WORKFLOW · ALERT CENTER
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Centro de alertas operativas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Riesgos críticos, desviaciones y eventos que requieren atención inmediata.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            Auto-refresh 20s
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { k: "total",    label: "Total",     icon: Info,           color: "text-foreground" },
          { k: "critical", label: "Críticas",  icon: AlertOctagon,   color: "text-red-300" },
          { k: "warning",  label: "Atención",  icon: AlertTriangle,  color: "text-amber-300" },
          { k: "info",     label: "Informativas", icon: Info,        color: "text-blue-300" },
        ] as const).map((m) => (
          <div key={m.k} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{m.label}</span>
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
            </div>
            <div className={`text-2xl font-semibold ${m.color}`}>{counts[m.k]}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {(["activa", "reconocida", "resuelta", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border transition ${
              statusFilter === s
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:text-foreground"
            }`}
          >
            {s === "all" ? "Todas" : s}
          </button>
        ))}
        <div className="w-px h-5 bg-white/[0.08] mx-2" />
        {(["all", "critical", "warning", "info"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSevFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border transition ${
              sevFilter === s
                ? "bg-foreground/10 text-foreground border-white/20"
                : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:text-foreground"
            }`}
          >
            {s === "all" ? "Severidad" : s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-xs text-muted-foreground font-mono">Cargando alertas…</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-8 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400/80 mb-2" />
            <div className="text-sm">Sin alertas en este filtro.</div>
            <div className="text-xs text-muted-foreground mt-1">Operación bajo control.</div>
          </div>
        )}
        {filtered.map((a) => {
          const M = SEV_META[a.severity];
          return (
            <div key={a.id} className={`rounded-lg border ${M.ring} p-4 flex items-start gap-4`}>
              <div className={`h-9 w-9 rounded-md flex items-center justify-center border border-white/10 ${M.color}`}>
                <M.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-mono tracking-[0.25em] uppercase ${M.color}`}>{M.label}</span>
                  <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
                    {a.source}
                  </span>
                  <span className="text-[10px] text-muted-foreground">· {timeAgo(a.created_at)}</span>
                  <span className={`ml-auto text-[9px] font-mono tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border ${
                    a.status === "activa" ? "border-red-500/30 text-red-300"
                    : a.status === "reconocida" ? "border-amber-500/30 text-amber-300"
                    : "border-emerald-500/30 text-emerald-300"
                  }`}>{a.status}</span>
                </div>
                <div className="text-sm font-medium">{a.title}</div>
                {a.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {a.link && (
                    <a href={a.link} className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-white/[0.08] hover:bg-white/[0.04] transition">
                      <Eye className="h-3 w-3 inline mr-1" /> Ver
                    </a>
                  )}
                  {a.status === "activa" && (
                    <button
                      onClick={() => update(a.id, "reconocida")}
                      className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-200 hover:bg-amber-500/10 transition"
                    >
                      Reconocer
                    </button>
                  )}
                  {a.status !== "resuelta" && (
                    <button
                      onClick={() => update(a.id, "resuelta")}
                      className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10 transition"
                    >
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
