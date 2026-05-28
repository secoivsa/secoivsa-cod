import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateExecutiveInsights } from "@/lib/ai-insights.functions";
import {
  Brain, Sparkles, TrendingUp, AlertTriangle, ShieldCheck, Activity,
  Loader2, Briefcase, Users, DollarSign, CheckSquare, Bell, Factory, Package,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Route = createFileRoute("/_authenticated/nexus/intelligence")({
  component: IntelligencePage,
});

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const fmtInt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

function IntelligencePage() {
  const callInsights = useServerFn(generateExecutiveInsights);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ insights: string; snapshot: any } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ====== Smart KPIs en vivo
  const { data: kpis } = useQuery({
    queryKey: ["intelligence", "kpis"],
    refetchInterval: 30_000,
    queryFn: async () => {
      const [projects, alerts, approvals, incidents, materials, progress, opps, events] = await Promise.all([
        supabase.from("projects").select("id, status, progress_pct, budget"),
        supabase.from("alerts").select("id, severity").eq("status", "activa"),
        supabase.from("approvals").select("id").eq("status", "pendiente"),
        supabase.from("incidents").select("id, severity, occurred_at"),
        supabase.from("materials").select("stock, min_stock"),
        supabase.from("progress_entries").select("hours, progress_pct, reported_at").order("reported_at", { ascending: false }).limit(60),
        supabase.from("opportunities").select("value, stage").not("stage", "in", "(perdido,aprobado)"),
        supabase.from("system_events").select("id, severity, created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      const projs = projects.data ?? [];
      const activos = projs.filter((p: any) => ["en_curso", "planeacion"].includes(p.status));
      const avg = projs.length
        ? Math.round(projs.reduce((s: number, p: any) => s + Number(p.progress_pct ?? 0), 0) / projs.length)
        : 0;
      const budget = projs.reduce((s: number, p: any) => s + Number(p.budget ?? 0), 0);
      const lowStock = (materials.data ?? []).filter(
        (m: any) => m.min_stock > 0 && Number(m.stock) <= Number(m.min_stock),
      ).length;
      const hrs30 = (progress.data ?? []).reduce((s: number, p: any) => s + Number(p.hours ?? 0), 0);
      const pipelineValor = (opps.data ?? []).reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);
      const eventsCriticos = (events.data ?? []).filter((e: any) => e.severity === "critical").length;
      return {
        proyectos: { total: projs.length, activos: activos.length, avg, budget },
        alertas: {
          total: (alerts.data ?? []).length,
          criticas: (alerts.data ?? []).filter((a: any) => a.severity === "critical").length,
        },
        aprobaciones: (approvals.data ?? []).length,
        incidentes: (incidents.data ?? []).length,
        lowStock,
        hrs30,
        pipelineValor,
        pipelineN: (opps.data ?? []).length,
        eventsCriticos,
      };
    },
  });

  const runAnalysis = async () => {
    setRunning(true);
    setErr(null);
    try {
      const res = await callInsights({});
      setResult(res);
    } catch (e: any) {
      setErr(e?.message ?? "Error generando análisis");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-2">
            <Brain className="h-3 w-3 text-primary" />
            Intelligence · Executive AI
          </div>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
            Centro de Inteligencia Operativa
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Diagnóstico ejecutivo asistido por IA en tiempo real sobre todos los módulos NEXUS.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-mono text-[11px] tracking-[0.2em] uppercase shadow-lg shadow-primary/20 hover:shadow-primary/40 transition disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {running ? "Analizando…" : "Generar análisis IA"}
        </button>
      </header>

      {/* Smart KPI Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Briefcase} label="Proyectos activos" value={fmtInt(kpis?.proyectos.activos ?? 0)}
             sub={`${kpis?.proyectos.avg ?? 0}% avance promedio`} accent="text-primary" />
        <KPI icon={DollarSign} label="Presupuesto bajo control" value={fmtMoney(kpis?.proyectos.budget ?? 0)}
             sub={`${kpis?.proyectos.total ?? 0} proyectos totales`} />
        <KPI icon={Bell} label="Alertas activas" value={fmtInt(kpis?.alertas.total ?? 0)}
             sub={`${kpis?.alertas.criticas ?? 0} críticas`}
             accent={kpis && kpis.alertas.criticas > 0 ? "text-red-400" : ""} />
        <KPI icon={CheckSquare} label="Aprobaciones pendientes" value={fmtInt(kpis?.aprobaciones ?? 0)}
             sub="esperando decisión" />
        <KPI icon={Factory} label="Horas productivas (30d)" value={fmtInt(Math.round(kpis?.hrs30 ?? 0))}
             sub="horas-hombre" />
        <KPI icon={Package} label="Materiales bajo stock" value={fmtInt(kpis?.lowStock ?? 0)}
             sub="por reposicionar"
             accent={kpis && kpis.lowStock > 0 ? "text-amber-400" : ""} />
        <KPI icon={TrendingUp} label="Pipeline comercial" value={fmtMoney(kpis?.pipelineValor ?? 0)}
             sub={`${kpis?.pipelineN ?? 0} oportunidades`} />
        <KPI icon={Activity} label="Eventos críticos" value={fmtInt(kpis?.eventsCriticos ?? 0)}
             sub="últimos 100 registros" />
      </section>

      {/* AI panel */}
      <section className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/15 grid place-items-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium">Análisis ejecutivo IA</div>
            <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
              Gemini · operación industrial
            </div>
          </div>
        </div>

        <div className="p-6 min-h-[260px]">
          {err && (
            <div className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {err}
            </div>
          )}

          {!result && !err && !running && (
            <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
              <Brain className="h-10 w-10 text-muted-foreground/40" />
              <div className="text-sm text-muted-foreground max-w-md">
                Genere un diagnóstico operativo: la IA leerá proyectos, alertas, calidad, seguridad, supply y producción para entregar riesgos y acciones priorizadas.
              </div>
            </div>
          )}

          {running && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <div className="text-xs font-mono tracking-[0.2em] uppercase">Analizando operación…</div>
            </div>
          )}

          {result && (
            <div className="grid lg:grid-cols-[1fr_280px] gap-6">
              <article className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-base prose-h2:mt-5 prose-h2:mb-2 prose-h2:text-primary prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                <ReactMarkdown>{result.insights}</ReactMarkdown>
              </article>
              <aside className="rounded-lg border border-white/[0.06] bg-black/30 p-4 text-[11px] font-mono space-y-2 h-fit">
                <div className="text-muted-foreground tracking-[0.2em] uppercase mb-2">Snapshot</div>
                <SnapRow k="Proyectos activos" v={result.snapshot.projects.activos} />
                <SnapRow k="Avance promedio" v={`${result.snapshot.projects.avg_pct}%`} />
                <SnapRow k="Alertas críticas" v={result.snapshot.alerts.criticas} />
                <SnapRow k="Aprobaciones" v={result.snapshot.approvals_pendientes} />
                <SnapRow k="Inspecciones ✗" v={result.snapshot.inspections_rechazadas} />
                <SnapRow k="Incidentes graves" v={result.snapshot.incidents_mayores} />
                <SnapRow k="Stock bajo" v={result.snapshot.materials_bajo_stock} />
                <SnapRow k="Hrs productivas 30d" v={fmtInt(Math.round(result.snapshot.productividad_hrs_30d))} />
                <SnapRow k="Pipeline" v={fmtMoney(result.snapshot.oportunidades_valor)} />
              </aside>
            </div>
          )}
        </div>
      </section>

      <p className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground/60 text-center">
        Datos en tiempo real · IA empresarial · NEXUS Intelligence
      </p>
    </div>
  );
}

function KPI({
  icon: Icon, label, value, sub, accent,
}: { icon: any; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`h-7 w-7 rounded-md bg-primary/10 grid place-items-center ${accent ?? "text-primary"}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <ShieldCheck className="h-3 w-3 text-muted-foreground/30" />
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${accent ?? ""}`}>{value}</div>
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60 mt-1">{sub}</div>}
    </div>
  );
}

function SnapRow({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
