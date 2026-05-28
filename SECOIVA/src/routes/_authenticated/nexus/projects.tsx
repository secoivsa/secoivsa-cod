import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Briefcase, Plus, MapPin, Calendar, ArrowUpRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  client?: { id: string; name: string } | null;
};
type ProjectStatus = Database["public"]["Enums"]["project_status"];

const STATUS_META: Record<ProjectStatus, { label: string; color: string }> = {
  planeacion: { label: "Planeación", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  en_curso: { label: "Activo", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  pausado: { label: "Pausado", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  completado: { label: "Finalizado", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  cancelado: { label: "Cancelado", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/_authenticated/nexus/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const { profile, user } = useAuth();
  const orgId = profile?.organization_id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", code: "", client_id: "", location: "",
    budget: "", start_date: "", end_date: "", description: "",
    status: "planeacion" as ProjectStatus,
  });
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: rows, error }, { data: cls }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name"),
      ]);
      if (error) throw error;
      const map = new Map((cls ?? []).map((c) => [c.id, c]));
      return (rows ?? []).map((r) => ({ ...r, client: r.client_id ? map.get(r.client_id) ?? null : null })) as Project[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["projects", "clients-mini", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name").order("name");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { error } = await supabase.from("projects").insert({
        organization_id: orgId,
        name: form.name,
        code: form.code || null,
        client_id: form.client_id || null,
        location: form.location || null,
        budget: form.budget ? Number(form.budget) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
        status: form.status,
        created_by: user?.id ?? null,
        project_manager_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["nexus", "core", "kpis"] });
      toast.success("Proyecto creado");
      setOpen(false);
      setForm({ name: "", code: "", client_id: "", location: "", budget: "", start_date: "", end_date: "", description: "", status: "planeacion" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const stats = {
    total: projects.length,
    activos: projects.filter((p) => p.status === "en_curso").length,
    presupuesto: projects.reduce((s, p) => s + Number(p.budget ?? 0), 0),
    avance: projects.length ? projects.reduce((s, p) => s + Number(p.progress_pct ?? 0), 0) / projects.length : 0,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            02 · PROJECTS · operación industrial
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Núcleo operativo. Cada proyecto sincroniza producción, calidad, seguridad y finanzas.
          </p>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="font-mono text-[11px] uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo proyecto
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nuevo proyecto</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Código</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="mt-1.5 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Estatus</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_META).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cliente</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Ubicación</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Presupuesto</Label>
                  <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="mt-1.5 font-mono" />
                </div>
                <div />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1.5 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Término</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1.5 font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending} className="w-full">
                {create.isPending ? "Creando…" : "Crear proyecto"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Total proyectos", v: stats.total },
          { l: "Activos", v: stats.activos },
          { l: "Presupuesto", v: fmtMoney(stats.presupuesto) },
          { l: "Avance promedio", v: `${stats.avance.toFixed(1)}%` },
        ].map((k) => (
          <div key={k.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{k.l}</div>
            <div className="mt-2 text-2xl font-bold font-mono">{k.v}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...Object.keys(STATUS_META)] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as ProjectStatus | "all")}
            className={`px-3 py-1.5 rounded-md border font-mono text-[10px] uppercase tracking-[0.15em] transition ${
              filter === s
                ? "bg-primary/15 border-primary/40 text-foreground"
                : "border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            {s === "all" ? "Todos" : STATUS_META[s as ProjectStatus].label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const meta = STATUS_META[p.status];
          return (
            <Link
              key={p.id}
              to="/nexus/projects/$projectId"
              params={{ projectId: p.id }}
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-primary/40 hover:bg-white/[0.04] transition block"
            >
              <div className="flex items-start justify-between">
                <div className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-[0.15em] ${meta.color}`}>
                  {meta.label}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
              <div className="mt-3">
                {p.code && <div className="font-mono text-[10px] text-muted-foreground tracking-wider">{p.code}</div>}
                <h3 className="text-base font-semibold leading-tight mt-0.5">{p.name}</h3>
                <div className="text-xs text-muted-foreground mt-1">{p.client?.name ?? "Sin cliente"}</div>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <span>Avance</span>
                  <span className="text-foreground">{Number(p.progress_pct ?? 0).toFixed(0)}%</span>
                </div>
                <Progress value={Number(p.progress_pct ?? 0)} className="h-1" />
              </div>
              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> {p.location ?? "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {p.start_date ?? "—"}
                </span>
              </div>
              {p.budget != null && (
                <div className="mt-2 text-xs font-mono font-semibold">{fmtMoney(Number(p.budget))}</div>
              )}
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] p-12 text-center">
            <Briefcase className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">Sin proyectos en este filtro</p>
          </div>
        )}
      </section>
    </div>
  );
}
