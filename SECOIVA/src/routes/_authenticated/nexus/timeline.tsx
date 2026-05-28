import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  FileText,
  Briefcase,
  ClipboardList,
  Truck,
  Warehouse,
  HardHat,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/timeline")({
  component: TimelinePage,
});

type EventKind =
  | "quote"
  | "opportunity"
  | "project"
  | "requisition"
  | "purchase_order"
  | "warehouse"
  | "progress"
  | "evidence"
  | "inspection"
  | "non_conformity"
  | "permit"
  | "incident";

type TimelineEvent = {
  id: string;
  kind: EventKind;
  at: string;
  title: string;
  subtitle?: string;
  project_id?: string | null;
  status?: string | null;
  folio?: string | null;
  severity?: string | null;
};

const KIND_META: Record<EventKind, { label: string; icon: typeof Activity; color: string; module: string; route?: string }> = {
  quote:          { label: "Cotización",       icon: FileText,       color: "text-blue-300",   module: "CRM",        route: "/nexus/crm" },
  opportunity:    { label: "Oportunidad",      icon: Briefcase,      color: "text-blue-300",   module: "CRM",        route: "/nexus/crm" },
  project:        { label: "Proyecto",         icon: Briefcase,      color: "text-primary",    module: "PROJECTS",   route: "/nexus/projects" },
  requisition:    { label: "Requisición",      icon: ClipboardList,  color: "text-amber-300",  module: "SUPPLY",     route: "/nexus/supply" },
  purchase_order: { label: "Orden de compra",  icon: Truck,          color: "text-amber-300",  module: "SUPPLY",     route: "/nexus/supply" },
  warehouse:      { label: "Movimiento almacén",icon: Warehouse,     color: "text-amber-200",  module: "SUPPLY",     route: "/nexus/supply" },
  progress:       { label: "Avance producción",icon: HardHat,        color: "text-emerald-300",module: "PRODUCTION", route: "/nexus/production" },
  evidence:       { label: "Evidencia",        icon: ImageIcon,      color: "text-emerald-200",module: "PRODUCTION", route: "/nexus/production" },
  inspection:     { label: "Inspección",       icon: ShieldCheck,    color: "text-violet-300", module: "QUALITY",    route: "/nexus/quality" },
  non_conformity: { label: "No conformidad",   icon: AlertTriangle,  color: "text-red-300",    module: "QUALITY",    route: "/nexus/quality" },
  permit:         { label: "Permiso de trabajo",icon: CheckCircle2,  color: "text-orange-300", module: "SAFETY",     route: "/nexus/safety" },
  incident:       { label: "Incidente",        icon: AlertTriangle,  color: "text-red-400",    module: "SAFETY",     route: "/nexus/safety" },
};

function relative(date: string) {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function TimelinePage() {
  const [filter, setFilter] = useState<EventKind | "all">("all");

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["nexus", "timeline"],
    queryFn: async (): Promise<TimelineEvent[]> => {
      const limit = 40;
      const [q, op, pr, rq, po, wm, pe, ev, ins, nc, wp, inc] = await Promise.all([
        supabase.from("quotes").select("id, folio, title, status, created_at, opportunity_id").order("created_at", { ascending: false }).limit(limit),
        supabase.from("opportunities").select("id, title, stage, value, created_at, project_id, client_id").order("created_at", { ascending: false }).limit(limit),
        supabase.from("projects").select("id, name, code, status, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("requisitions").select("id, folio, title, status, project_id, total, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("purchase_orders").select("id, folio, status, project_id, total, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("warehouse_movements").select("id, movement_type, quantity, project_id, created_at, material_id").order("created_at", { ascending: false }).limit(limit),
        supabase.from("progress_entries").select("id, title, progress_pct, status, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("evidences").select("id, title, kind, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("inspections").select("id, folio, title, status, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("non_conformities").select("id, folio, title, severity, status, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("work_permits").select("id, folio, title, status, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
        supabase.from("incidents").select("id, folio, title, severity, status, project_id, created_at").order("created_at", { ascending: false }).limit(limit),
      ]);

      const all: TimelineEvent[] = [];
      (q.data ?? []).forEach((r: any) => all.push({ id: `q-${r.id}`, kind: "quote", at: r.created_at, title: r.title || `Cotización ${r.folio}`, subtitle: r.folio, status: r.status, folio: r.folio }));
      (op.data ?? []).forEach((r: any) => all.push({ id: `op-${r.id}`, kind: "opportunity", at: r.created_at, title: r.title, subtitle: `etapa: ${r.stage}`, project_id: r.project_id, status: r.stage }));
      (pr.data ?? []).forEach((r: any) => all.push({ id: `pr-${r.id}`, kind: "project", at: r.created_at, title: r.name, subtitle: r.code ?? "Proyecto nuevo", project_id: r.id, status: r.status }));
      (rq.data ?? []).forEach((r: any) => all.push({ id: `rq-${r.id}`, kind: "requisition", at: r.created_at, title: r.title || r.folio, subtitle: r.folio, project_id: r.project_id, status: r.status, folio: r.folio }));
      (po.data ?? []).forEach((r: any) => all.push({ id: `po-${r.id}`, kind: "purchase_order", at: r.created_at, title: `OC ${r.folio}`, subtitle: `total: $${Number(r.total ?? 0).toLocaleString("es-MX")}`, project_id: r.project_id, status: r.status, folio: r.folio }));
      (wm.data ?? []).forEach((r: any) => all.push({ id: `wm-${r.id}`, kind: "warehouse", at: r.created_at, title: `${r.movement_type === "entrada" ? "Entrada" : r.movement_type === "salida" ? "Salida" : "Ajuste"} · ${r.quantity}`, subtitle: "Movimiento de almacén", project_id: r.project_id, status: r.movement_type }));
      (pe.data ?? []).forEach((r: any) => all.push({ id: `pe-${r.id}`, kind: "progress", at: r.created_at, title: r.title, subtitle: `${Number(r.progress_pct).toFixed(0)}% · ${r.status}`, project_id: r.project_id, status: r.status }));
      (ev.data ?? []).forEach((r: any) => all.push({ id: `ev-${r.id}`, kind: "evidence", at: r.created_at, title: r.title || `${r.kind} adjunta`, subtitle: r.kind, project_id: r.project_id }));
      (ins.data ?? []).forEach((r: any) => all.push({ id: `in-${r.id}`, kind: "inspection", at: r.created_at, title: r.title, subtitle: r.folio, project_id: r.project_id, status: r.status, folio: r.folio }));
      (nc.data ?? []).forEach((r: any) => all.push({ id: `nc-${r.id}`, kind: "non_conformity", at: r.created_at, title: r.title, subtitle: `${r.folio} · severidad: ${r.severity}`, project_id: r.project_id, status: r.status, severity: r.severity, folio: r.folio }));
      (wp.data ?? []).forEach((r: any) => all.push({ id: `wp-${r.id}`, kind: "permit", at: r.created_at, title: r.title, subtitle: r.folio, project_id: r.project_id, status: r.status, folio: r.folio }));
      (inc.data ?? []).forEach((r: any) => all.push({ id: `inc-${r.id}`, kind: "incident", at: r.created_at, title: r.title, subtitle: `${r.folio} · ${r.severity}`, project_id: r.project_id, status: r.status, severity: r.severity, folio: r.folio }));

      return all.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    },
    refetchInterval: 30000,
  });

  const projectIds = useMemo(() => Array.from(new Set(events.map((e) => e.project_id).filter(Boolean))) as string[], [events]);

  const { data: projectMap = {} } = useQuery({
    queryKey: ["nexus", "timeline", "projects", projectIds],
    enabled: projectIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, code").in("id", projectIds);
      return Object.fromEntries((data ?? []).map((p: any) => [p.id, p]));
    },
  });

  const filtered = filter === "all" ? events : events.filter((e) => e.kind === filter);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const day = new Date(e.at).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const filterChips: Array<{ k: EventKind | "all"; label: string }> = [
    { k: "all", label: "Todos" },
    { k: "project", label: "Proyectos" },
    { k: "quote", label: "Cotizaciones" },
    { k: "requisition", label: "Requisiciones" },
    { k: "purchase_order", label: "Compras" },
    { k: "warehouse", label: "Almacén" },
    { k: "progress", label: "Avances" },
    { k: "evidence", label: "Evidencias" },
    { k: "inspection", label: "Inspecciones" },
    { k: "non_conformity", label: "No conformidades" },
    { k: "permit", label: "Permisos" },
    { k: "incident", label: "Incidentes" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            TIMELINE · Actividad global
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">Operación en tiempo real</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Línea de tiempo unificada de todos los módulos NEXUS OS · {events.length} eventos recientes
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">Auto-refresh</div>
          <div className="font-mono text-sm flex items-center gap-2 justify-end">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> cada 30s
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {filterChips.map((c) => (
          <button
            key={c.k}
            onClick={() => setFilter(c.k)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-[0.15em] border transition ${
              filter === c.k
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm text-muted-foreground font-mono">Cargando línea de tiempo…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground font-mono">
          Sin actividad registrada todavía.
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([day, items]) => (
            <section key={day}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">{day}</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-mono text-muted-foreground/60">{items.length}</span>
              </div>
              <ol className="relative border-l border-white/[0.06] ml-2 space-y-3">
                {items.map((e) => {
                  const meta = KIND_META[e.kind];
                  const Icon = meta.icon;
                  const project = e.project_id ? (projectMap as any)[e.project_id] : null;
                  return (
                    <li key={e.id} className="relative pl-6">
                      <span className="absolute -left-[7px] top-3 h-3 w-3 rounded-full bg-[#0a0d12] border-2 border-white/20 group-hover:border-primary" />
                      <Link
                        to={(meta.route ?? "/nexus") as never}
                        className="block rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 hover:bg-white/[0.04] transition p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`h-9 w-9 shrink-0 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center ${meta.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{meta.module}</span>
                              <span className="text-muted-foreground/40">·</span>
                              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{meta.label}</span>
                              {e.status && (
                                <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/[0.08] text-muted-foreground">
                                  {e.status}
                                </span>
                              )}
                              {e.severity && (
                                <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-red-500/30 text-red-300">
                                  {e.severity}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm font-medium text-foreground truncate">{e.title}</div>
                            {e.subtitle && (
                              <div className="text-xs text-muted-foreground mt-0.5 truncate">{e.subtitle}</div>
                            )}
                            {project && (
                              <div className="mt-1.5 text-[10px] font-mono text-primary/80">
                                ↳ {project.code ? `${project.code} · ` : ""}{project.name}
                              </div>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground/70 shrink-0">{relative(e.at)}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
