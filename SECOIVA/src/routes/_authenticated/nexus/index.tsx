import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Briefcase,
  UserPlus,
  Truck,
  Users,
  TrendingUp,
  Activity,
  AlertTriangle,
  ShieldCheck,
  HardHat,
  ClipboardList,
  Warehouse,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/")({
  component: CorePage,
});

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const fmtInt = (n: number) => new Intl.NumberFormat("es-MX").format(n);

function CorePage() {
  const { profile } = useAuth();

  // ============== LIVE KPIs aggregated from all modules ==============
  const { data: live } = useQuery({
    queryKey: ["nexus", "core", "live"],
    refetchInterval: 30000,
    queryFn: async () => {
      const [
        projects, clients, suppliers, employees,
        opps, quotes, reqs, pos,
        progress, inspections, ncs, incidents, permits,
      ] = await Promise.all([
        supabase.from("projects").select("id, status, progress_pct, budget"),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("suppliers").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "activo"),
        supabase.from("opportunities").select("id, stage, value, probability"),
        supabase.from("quotes").select("id, status, total, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("requisitions").select("id, status, total, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("purchase_orders").select("id, status, total, expected_date, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("progress_entries").select("id, progress_pct, hours, personnel_count, reported_at").order("reported_at", { ascending: false }).limit(30),
        supabase.from("inspections").select("id, status, scheduled_date"),
        supabase.from("non_conformities").select("id, status, severity"),
        supabase.from("incidents").select("id, status, severity, occurred_at"),
        supabase.from("work_permits").select("id, status, valid_to"),
      ]);

      const projs = projects.data ?? [];
      const proyectosActivos = projs.filter((p: any) => p.status === "en_curso").length;
      const presupuestoTotal = projs.reduce((s: number, p: any) => s + Number(p.budget ?? 0), 0);
      const avancePromedio = projs.length
        ? projs.reduce((s: number, p: any) => s + Number(p.progress_pct ?? 0), 0) / projs.length
        : 0;

      const oppsArr = opps.data ?? [];
      const pipeline = oppsArr
        .filter((o: any) => !["aprobado", "perdido"].includes(o.stage))
        .reduce((s: number, o: any) => s + Number(o.value ?? 0) * (Number(o.probability ?? 0) / 100), 0);
      const pipelineBruto = oppsArr
        .filter((o: any) => !["aprobado", "perdido"].includes(o.stage))
        .reduce((s: number, o: any) => s + Number(o.value ?? 0), 0);

      const reqsArr = reqs.data ?? [];
      const requisicionesActivas = reqsArr.filter((r: any) => ["enviada", "aprobada", "borrador"].includes(r.status)).length;
      const posArr = pos.data ?? [];
      const comprasPendientes = posArr.filter((p: any) => ["enviada", "aprobada", "parcial"].includes(p.status)).length;

      const prog = progress.data ?? [];
      const horasUlt7 = prog
        .filter((p: any) => new Date(p.reported_at).getTime() > Date.now() - 7 * 86400000)
        .reduce((s: number, p: any) => s + Number(p.hours ?? 0), 0);
      const personalUlt7 = prog
        .filter((p: any) => new Date(p.reported_at).getTime() > Date.now() - 7 * 86400000)
        .reduce((s: number, p: any) => s + Number(p.personnel_count ?? 0), 0);

      const insArr = inspections.data ?? [];
      const inspeccionesAbiertas = insArr.filter((i: any) => ["pendiente", "en_proceso"].includes(i.status)).length;
      const inspeccionesVencidas = insArr.filter(
        (i: any) => i.status === "pendiente" && i.scheduled_date && new Date(i.scheduled_date) < new Date()
      ).length;

      const ncArr = ncs.data ?? [];
      const ncsAbiertas = ncArr.filter((n: any) => n.status === "abierta").length;
      const ncsCriticas = ncArr.filter((n: any) => n.severity === "critica" && n.status !== "cerrada").length;

      const incArr = incidents.data ?? [];
      const incidentesActivos = incArr.filter((i: any) => ["reportado", "en_investigacion"].includes(i.status)).length;
      const incidentesGraves = incArr.filter((i: any) => ["alta", "critica"].includes(i.severity) && i.status !== "cerrado").length;

      const permArr = permits.data ?? [];
      const permisosPorVencer = permArr.filter(
        (p: any) => p.status === "aprobado" && p.valid_to && new Date(p.valid_to).getTime() < Date.now() + 48 * 3600000 && new Date(p.valid_to).getTime() > Date.now()
      ).length;

      // Build week trend from progress entries
      const trend: number[] = Array(14).fill(0);
      const now = Date.now();
      prog.forEach((p: any) => {
        const days = Math.floor((now - new Date(p.reported_at).getTime()) / 86400000);
        if (days >= 0 && days < 14) trend[13 - days] += Number(p.hours ?? 0);
      });

      return {
        proyectosTotal: projs.length,
        proyectosActivos,
        presupuestoTotal,
        avancePromedio,
        clientes: clients.count ?? 0,
        proveedores: suppliers.count ?? 0,
        empleadosActivos: employees.count ?? 0,
        pipeline,
        pipelineBruto,
        cotizacionesAbiertas: (quotes.data ?? []).filter((q: any) => ["enviada", "borrador"].includes(q.status)).length,
        requisicionesActivas,
        comprasPendientes,
        horasUlt7,
        personalUlt7,
        inspeccionesAbiertas,
        inspeccionesVencidas,
        ncsAbiertas,
        ncsCriticas,
        incidentesActivos,
        incidentesGraves,
        permisosPorVencer,
        trend,
      };
    },
  });

  // ============== Recent activity preview ==============
  const { data: recent = [] } = useQuery({
    queryKey: ["nexus", "core", "recent"],
    refetchInterval: 30000,
    queryFn: async () => {
      const [pr, rq, po, pe, inc, nc] = await Promise.all([
        supabase.from("projects").select("id, name, code, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("requisitions").select("id, folio, title, status, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("purchase_orders").select("id, folio, status, total, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("progress_entries").select("id, title, progress_pct, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("incidents").select("id, folio, title, severity, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("non_conformities").select("id, folio, title, severity, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const items: Array<{ id: string; kind: string; title: string; sub?: string; at: string; icon: any; color: string }> = [];
      (pr.data ?? []).forEach((r: any) => items.push({ id: `pr-${r.id}`, kind: "Proyecto", title: r.name, sub: r.code, at: r.created_at, icon: Briefcase, color: "text-primary" }));
      (rq.data ?? []).forEach((r: any) => items.push({ id: `rq-${r.id}`, kind: "Requisición", title: r.title, sub: r.folio, at: r.created_at, icon: ClipboardList, color: "text-amber-300" }));
      (po.data ?? []).forEach((r: any) => items.push({ id: `po-${r.id}`, kind: "OC", title: `Orden ${r.folio}`, sub: fmtMoney(Number(r.total ?? 0)), at: r.created_at, icon: Truck, color: "text-amber-200" }));
      (pe.data ?? []).forEach((r: any) => items.push({ id: `pe-${r.id}`, kind: "Avance", title: r.title, sub: `${Number(r.progress_pct).toFixed(0)}%`, at: r.created_at, icon: HardHat, color: "text-emerald-300" }));
      (inc.data ?? []).forEach((r: any) => items.push({ id: `inc-${r.id}`, kind: "Incidente", title: r.title, sub: `${r.folio} · ${r.severity}`, at: r.created_at, icon: AlertTriangle, color: "text-red-400" }));
      (nc.data ?? []).forEach((r: any) => items.push({ id: `nc-${r.id}`, kind: "NC", title: r.title, sub: `${r.folio} · ${r.severity}`, at: r.created_at, icon: AlertTriangle, color: "text-red-300" }));
      return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 8);
    },
  });

  const relative = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const tiles = [
    { label: "Proyectos activos", value: fmtInt(live?.proyectosActivos ?? 0), sub: `${live?.proyectosTotal ?? 0} totales`, icon: Briefcase, to: "/nexus/projects" },
    { label: "Pipeline comercial", value: fmtMoney(live?.pipeline ?? 0), sub: `Bruto ${fmtMoney(live?.pipelineBruto ?? 0)}`, icon: TrendingUp, to: "/nexus/crm" },
    { label: "Avance promedio", value: `${(live?.avancePromedio ?? 0).toFixed(1)}%`, sub: "Todos los proyectos", icon: Activity, to: "/nexus/projects" },
    { label: "Presupuesto operativo", value: fmtMoney(live?.presupuestoTotal ?? 0), sub: "Consolidado MXN", icon: DollarSign, to: "/nexus/finance" },
  ];

  const opsTiles = [
    { label: "Requisiciones activas", value: live?.requisicionesActivas ?? 0, icon: ClipboardList, to: "/nexus/supply" },
    { label: "Órdenes en curso", value: live?.comprasPendientes ?? 0, icon: Truck, to: "/nexus/supply" },
    { label: "Cotizaciones abiertas", value: live?.cotizacionesAbiertas ?? 0, icon: UserPlus, to: "/nexus/crm" },
    { label: "Personal últimos 7d", value: fmtInt(live?.personalUlt7 ?? 0), icon: Users, to: "/nexus/hr" },
    { label: "Horas reportadas 7d", value: fmtInt(Math.round(live?.horasUlt7 ?? 0)), icon: Clock, to: "/nexus/production" },
    { label: "Inspecciones abiertas", value: live?.inspeccionesAbiertas ?? 0, icon: ShieldCheck, to: "/nexus/quality" },
  ];

  const alerts = [
    { label: "Incidentes graves activos", value: live?.incidentesGraves ?? 0, severity: "critical", to: "/nexus/safety" },
    { label: "No conformidades críticas", value: live?.ncsCriticas ?? 0, severity: "critical", to: "/nexus/quality" },
    { label: "Inspecciones vencidas", value: live?.inspeccionesVencidas ?? 0, severity: "high", to: "/nexus/quality" },
    { label: "Permisos por vencer 48h", value: live?.permisosPorVencer ?? 0, severity: "high", to: "/nexus/safety" },
    { label: "Incidentes activos totales", value: live?.incidentesActivos ?? 0, severity: "medium", to: "/nexus/safety" },
    { label: "NCs abiertas totales", value: live?.ncsAbiertas ?? 0, severity: "medium", to: "/nexus/quality" },
  ];

  // Build SVG path for trend
  const trend = live?.trend ?? Array(14).fill(0);
  const maxTrend = Math.max(1, ...trend);
  const pts = trend.map((v, i) => `${(i / (trend.length - 1)) * 600},${170 - (v / maxTrend) * 140}`).join(" ");
  const areaPath = `M0,180 L${pts.split(" ").join(" L")} L600,180 Z`;
  const linePath = `M${pts.split(" ").join(" L")}`;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px]">
      {/* HEADER */}
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            01 · CORE · Industrial Operating System
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">
            Bienvenido, {profile?.full_name?.split(" ")[0] ?? "Operador"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centro de operación industrial en tiempo real · datos vivos de toda la organización.
          </p>
        </div>
        <Link
          to="/nexus/timeline"
          className="group flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/[0.08] hover:border-primary/40 bg-white/[0.02] hover:bg-primary/5 transition"
        >
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em]">Ver timeline operativo</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition" />
        </Link>
      </header>

      {/* KPI TILES — strategic */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to as never}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-primary/30 hover:bg-white/[0.04] transition group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                {t.label}
              </span>
              <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <t.icon className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-bold font-mono">{t.value}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">{t.sub}</div>
            <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
            </div>
          </Link>
        ))}
      </section>

      {/* PRODUCTIVITY TREND + ALERTS */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Productividad · horas reportadas (14 días)
            </h2>
            <span className="text-[10px] font-mono text-success flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> LIVE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Horas 7d</div>
              <div className="mt-1 text-2xl font-bold font-mono">{fmtInt(Math.round(live?.horasUlt7 ?? 0))}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Personal 7d</div>
              <div className="mt-1 text-2xl font-bold font-mono">{fmtInt(live?.personalUlt7 ?? 0)}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Productividad</div>
              <div className="mt-1 text-2xl font-bold font-mono">
                {(live?.personalUlt7 ?? 0) > 0 ? ((live!.horasUlt7 / live!.personalUlt7)).toFixed(1) : "0.0"}<span className="text-xs text-muted-foreground ml-1">h/pp</span>
              </div>
            </div>
          </div>
          <div className="relative h-48 rounded-lg overflow-hidden bg-[#06080c] border border-white/[0.04]">
            <svg viewBox="0 0 600 180" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.18 248)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="oklch(0.62 0.18 248)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1="0" x2="600" y1={i * 36 + 18} y2={i * 36 + 18} stroke="rgba(255,255,255,0.04)" />
              ))}
              <path d={areaPath} fill="url(#cg)" />
              <path d={linePath} stroke="oklch(0.62 0.18 248)" strokeWidth="1.5" fill="none" />
              {trend.map((v, i) => (
                <circle
                  key={i}
                  cx={(i / (trend.length - 1)) * 600}
                  cy={170 - (v / maxTrend) * 140}
                  r="2"
                  fill="oklch(0.62 0.18 248)"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* ALERTS */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Alertas operativas
          </h2>
          <ul className="space-y-2">
            {alerts.map((a) => {
              const tone =
                a.value === 0
                  ? "text-muted-foreground border-white/[0.04]"
                  : a.severity === "critical"
                  ? "text-red-300 border-red-500/30 bg-red-500/[0.04]"
                  : a.severity === "high"
                  ? "text-amber-300 border-amber-500/30 bg-amber-500/[0.04]"
                  : "text-foreground border-white/[0.08]";
              return (
                <Link
                  key={a.label}
                  to={a.to as never}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-md border transition hover:bg-white/[0.04] ${tone}`}
                >
                  <span className="text-xs">{a.label}</span>
                  <span className="font-mono text-lg font-bold">{a.value}</span>
                </Link>
              );
            })}
          </ul>
        </div>
      </section>

      {/* OPERATIONS GRID */}
      <section>
        <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3 flex items-center gap-2">
          <Warehouse className="h-3.5 w-3.5 text-primary" /> Operación viva
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {opsTiles.map((t) => (
            <Link
              key={t.label}
              to={t.to as never}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30 hover:bg-white/[0.04] transition group"
            >
              <div className="flex items-center justify-between">
                <t.icon className="h-3.5 w-3.5 text-primary" />
                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
              </div>
              <div className="mt-3 text-2xl font-bold font-mono">{t.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY + ORG SNAPSHOT */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" /> Actividad reciente
            </h2>
            <Link to="/nexus/timeline" className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary hover:text-primary/80 flex items-center gap-1">
              Ver todo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground font-mono">
              Sin actividad reciente. La operación se mostrará aquí en cuanto inicie.
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-white/[0.04] hover:border-white/10 hover:bg-white/[0.02] transition"
                >
                  <div className={`h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center ${r.color}`}>
                    <r.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{r.kind}</span>
                      {r.sub && <span className="text-[10px] font-mono text-muted-foreground/70">{r.sub}</span>}
                    </div>
                    <div className="text-sm truncate">{r.title}</div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/70">{relative(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Snapshot organización
          </h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <span className="text-muted-foreground text-xs">Clientes registrados</span>
              <span className="font-mono font-bold">{fmtInt(live?.clientes ?? 0)}</span>
            </li>
            <li className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <span className="text-muted-foreground text-xs">Proveedores</span>
              <span className="font-mono font-bold">{fmtInt(live?.proveedores ?? 0)}</span>
            </li>
            <li className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <span className="text-muted-foreground text-xs">Personal activo</span>
              <span className="font-mono font-bold">{fmtInt(live?.empleadosActivos ?? 0)}</span>
            </li>
            <li className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <span className="text-muted-foreground text-xs">Proyectos totales</span>
              <span className="font-mono font-bold">{fmtInt(live?.proyectosTotal ?? 0)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Módulos operativos</span>
              <span className="font-mono font-bold text-success">10 / 10</span>
            </li>
          </ul>
        </div>
      </section>

      <footer className="text-center pt-4 pb-2">
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground/60">
          NEXUS OS · Industrial Operating System · SECOIVSA
        </p>
      </footer>
    </div>
  );
}
