import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Factory, Plus, TrendingUp, Camera, Layers, Activity as ActivityIcon,
  Upload, FileImage, FileVideo, FileText, Loader2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProgressEntry = Database["public"]["Tables"]["progress_entries"]["Row"];
type WorkFront = Database["public"]["Tables"]["work_fronts"]["Row"];
type Evidence = Database["public"]["Tables"]["evidences"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

const WF_STATUS = [
  { id: "planeado", label: "Planeado", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "activo", label: "Activo", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "pausado", label: "Pausado", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "completado", label: "Completado", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
] as const;

export const Route = createFileRoute("/_authenticated/nexus/production")({
  component: ProductionPage,
});

function ProductionPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            04 · PRODUCTION · operación industrial
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Factory className="h-7 w-7 text-primary" /> Producción de obra
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Avances, frentes de trabajo y evidencias — sincronizados con Projects, Quality y Safety.
          </p>
        </div>
        <ProductionKpis orgId={orgId} />
      </header>

      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 h-auto">
          <TabsTrigger value="progress" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <TrendingUp className="h-3.5 w-3.5 mr-2" /> Avances
          </TabsTrigger>
          <TabsTrigger value="fronts" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <Layers className="h-3.5 w-3.5 mr-2" /> Frentes
          </TabsTrigger>
          <TabsTrigger value="evidences" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <Camera className="h-3.5 w-3.5 mr-2" /> Evidencias
          </TabsTrigger>
          <TabsTrigger value="timeline" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <ActivityIcon className="h-3.5 w-3.5 mr-2" /> Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="mt-6"><ProgressTab orgId={orgId} /></TabsContent>
        <TabsContent value="fronts" className="mt-6"><FrontsTab orgId={orgId} /></TabsContent>
        <TabsContent value="evidences" className="mt-6"><EvidencesTab orgId={orgId} /></TabsContent>
        <TabsContent value="timeline" className="mt-6"><TimelineTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ProductionKpis({ orgId }: { orgId?: string | null }) {
  const { data } = useQuery({
    queryKey: ["production", "kpis", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [{ count: todayProgress }, { count: activeFronts }, { data: projects }, { count: evidenceCount }] = await Promise.all([
        supabase.from("progress_entries").select("id", { count: "exact", head: true }).eq("reported_at", today),
        supabase.from("work_fronts").select("id", { count: "exact", head: true }).eq("status", "activo"),
        supabase.from("projects").select("progress_pct").in("status", ["en_curso", "planeacion"]),
        supabase.from("evidences").select("id", { count: "exact", head: true }),
      ]);
      const avg = projects?.length ? Math.round(projects.reduce((s, p) => s + Number(p.progress_pct ?? 0), 0) / projects.length) : 0;
      return { todayProgress: todayProgress ?? 0, activeFronts: activeFronts ?? 0, avg, evidenceCount: evidenceCount ?? 0 };
    },
  });
  const items = [
    { label: "Avances hoy", value: data?.todayProgress ?? 0 },
    { label: "Frentes activos", value: data?.activeFronts ?? 0 },
    { label: "Avance promedio", value: `${data?.avg ?? 0}%` },
    { label: "Evidencias", value: data?.evidenceCount ?? 0 },
  ];
  return (
    <div className="flex gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{i.label}</div>
          <div className="text-lg font-bold font-mono">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ============== PROGRESS ============== */
function ProgressTab({ orgId }: { orgId?: string | null }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["production", "progress", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: prog }, { data: prjs }, { data: fronts }] = await Promise.all([
        supabase.from("progress_entries").select("*").order("reported_at", { ascending: false }).limit(100),
        supabase.from("projects").select("id,name,code"),
        supabase.from("work_fronts").select("id,name"),
      ]);
      const pmap = new Map((prjs ?? []).map((p) => [p.id, p]));
      const fmap = new Map((fronts ?? []).map((f) => [f.id, f]));
      return (prog ?? []).map((r) => ({ ...r, project: pmap.get(r.project_id) ?? null, front: r.work_front_id ? fmap.get(r.work_front_id) : null })) as (ProgressEntry & { project: Pick<Project, "id" | "name" | "code"> | null; front?: { name: string } | null })[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{rows.length} avances registrados</span>
        <NewProgressSheet orgId={orgId} />
      </div>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {r.project?.name ?? "—"}{r.front ? ` · ${r.front.name}` : ""}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider border-white/10">
                    {new Date(r.reported_at).toLocaleDateString("es-MX")}
                  </Badge>
                </div>
                <h3 className="mt-1 font-medium">{r.title}</h3>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                <div className="mt-3 flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <span>{Number(r.hours).toFixed(1)} hrs</span>
                  <span>{r.personnel_count} personas</span>
                  <span className="uppercase tracking-wider">{r.status}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold font-mono text-primary">{Number(r.progress_pct).toFixed(0)}%</div>
                <Progress value={Number(r.progress_pct)} className="w-24 h-1 mt-1" />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sin avances registrados</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewProgressSheet({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    project_id: "", work_front_id: "", title: "", description: "",
    progress_pct: "0", hours: "0", personnel_count: "0",
    status: "en_curso" as "en_curso" | "pausado" | "completado",
    reported_at: new Date().toISOString().slice(0, 10),
  });

  const { data: refs } = useQuery({
    queryKey: ["production", "progress-refs", orgId, open],
    enabled: !!orgId && open,
    queryFn: async () => {
      const [{ data: prjs }, { data: fronts }] = await Promise.all([
        supabase.from("projects").select("id,name").order("name"),
        supabase.from("work_fronts").select("id,name,project_id").order("name"),
      ]);
      return { prjs: prjs ?? [], fronts: fronts ?? [] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId || !form.project_id || !form.title) throw new Error("Proyecto y título requeridos");
      const { error } = await supabase.from("progress_entries").insert({
        organization_id: orgId,
        project_id: form.project_id,
        work_front_id: form.work_front_id || null,
        title: form.title,
        description: form.description || null,
        progress_pct: Number(form.progress_pct) || 0,
        hours: Number(form.hours) || 0,
        personnel_count: Number(form.personnel_count) || 0,
        status: form.status,
        reported_at: form.reported_at,
        reported_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["nexus"] });
      toast.success("Avance registrado · proyecto actualizado");
      setOpen(false);
      setForm({ project_id: "", work_front_id: "", title: "", description: "", progress_pct: "0", hours: "0", personnel_count: "0", status: "en_curso", reported_at: new Date().toISOString().slice(0, 10) });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const availableFronts = (refs?.fronts ?? []).filter((f) => !form.project_id || f.project_id === form.project_id);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo avance
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Registrar avance</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-6">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v, work_front_id: "" })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>{(refs?.prjs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Frente de trabajo</Label>
            <Select value={form.work_front_id} onValueChange={(v) => setForm({ ...form, work_front_id: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>{availableFronts.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Título del avance</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Avance %</Label>
              <Input type="number" min="0" max="100" value={form.progress_pct} onChange={(e) => setForm({ ...form, progress_pct: e.target.value })} className="mt-1.5 font-mono" />
            </div>
            <div>
              <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Horas</Label>
              <Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="mt-1.5 font-mono" />
            </div>
            <div>
              <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Personas</Label>
              <Input type="number" value={form.personnel_count} onChange={(e) => setForm({ ...form, personnel_count: e.target.value })} className="mt-1.5 font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fecha</Label>
              <Input type="date" value={form.reported_at} onChange={(e) => setForm({ ...form, reported_at: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Estatus</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_curso">En curso</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
            {create.isPending ? "Registrando…" : "Registrar avance"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== WORK FRONTS ============== */
function FrontsTab({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["production", "fronts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: fronts }, { data: prjs }] = await Promise.all([
        supabase.from("work_fronts").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("id,name"),
      ]);
      const pmap = new Map((prjs ?? []).map((p) => [p.id, p]));
      return (fronts ?? []).map((f) => ({ ...f, project: pmap.get(f.project_id) ?? null })) as (WorkFront & { project: Pick<Project, "id" | "name"> | null })[];
    },
  });

  const moveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: WorkFront["status"] }) => {
      const { error } = await supabase.from("work_fronts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      toast.success("Frente actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{rows.length} frentes</span>
        <NewFrontSheet orgId={orgId} />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((f) => {
          const st = WF_STATUS.find((s) => s.id === f.status)!;
          return (
            <div key={f.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">{f.project?.name}</div>
                  <h3 className="mt-1 font-medium leading-tight">{f.name}</h3>
                </div>
                <div className={`shrink-0 px-2 py-0.5 rounded-md border font-mono text-[10px] uppercase tracking-[0.15em] ${st.color}`}>
                  {st.label}
                </div>
              </div>
              {f.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{f.description}</p>}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                  <span>Avance</span><span>{Number(f.progress_pct).toFixed(0)}%</span>
                </div>
                <Progress value={Number(f.progress_pct)} className="h-1" />
              </div>
              <Select value={f.status} onValueChange={(v) => moveStatus.mutate({ id: f.id, status: v as WorkFront["status"] })}>
                <SelectTrigger className="h-7 mt-3 text-[10px] font-mono uppercase tracking-wider bg-white/[0.02] border-white/[0.06]"><SelectValue /></SelectTrigger>
                <SelectContent>{WF_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sin frentes de trabajo</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NewFrontSheet({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ project_id: "", name: "", description: "", start_date: "", end_date: "" });

  const { data: projects = [] } = useQuery({
    queryKey: ["production", "front-projects", orgId, open],
    enabled: !!orgId && open,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id,name").order("name");
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId || !form.project_id || !form.name) throw new Error("Proyecto y nombre requeridos");
      const { error } = await supabase.from("work_fronts").insert({
        organization_id: orgId,
        project_id: form.project_id,
        name: form.name,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production"] });
      toast.success("Frente creado");
      setOpen(false);
      setForm({ project_id: "", name: "", description: "", start_date: "", end_date: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo frente
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nuevo frente de trabajo</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-6">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Nombre del frente</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Inicio</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fin</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1.5" />
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
            {create.isPending ? "Creando…" : "Crear frente"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== EVIDENCES ============== */
function EvidencesTab({ orgId }: { orgId?: string | null }) {
  const { data: rows = [] } = useQuery({
    queryKey: ["production", "evidences", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: evs }, { data: prjs }] = await Promise.all([
        supabase.from("evidences").select("*").order("created_at", { ascending: false }).limit(60),
        supabase.from("projects").select("id,name"),
      ]);
      const pmap = new Map((prjs ?? []).map((p) => [p.id, p]));
      return (evs ?? []).map((e) => ({ ...e, project: pmap.get(e.project_id) ?? null })) as (Evidence & { project: Pick<Project, "id" | "name"> | null })[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{rows.length} evidencias</span>
        <UploadEvidenceSheet orgId={orgId} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {rows.map((e) => (
          <div key={e.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden group hover:border-primary/30 transition">
            <div className="aspect-video bg-black/40 relative overflow-hidden">
              {e.kind === "foto" ? (
                <img src={e.file_url} alt={e.title ?? ""} className="w-full h-full object-cover" loading="lazy" />
              ) : e.kind === "video" ? (
                <div className="w-full h-full flex items-center justify-center"><FileVideo className="h-10 w-10 text-muted-foreground/40" /></div>
              ) : (
                <div className="w-full h-full flex items-center justify-center"><FileText className="h-10 w-10 text-muted-foreground/40" /></div>
              )}
              <Badge variant="outline" className="absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider bg-black/60 border-white/20">
                {e.kind}
              </Badge>
            </div>
            <div className="p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">{e.project?.name ?? "—"}</div>
              <div className="text-sm font-medium truncate mt-0.5">{e.title ?? "Sin título"}</div>
              <div className="text-[10px] font-mono text-muted-foreground/70 mt-1">{new Date(e.created_at).toLocaleDateString("es-MX")}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-white/[0.08] p-12 text-center">
            <FileImage className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sin evidencias subidas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadEvidenceSheet({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [progressId, setProgressId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: refs } = useQuery({
    queryKey: ["production", "evidence-refs", orgId, open, projectId],
    enabled: !!orgId && open,
    queryFn: async () => {
      const [{ data: prjs }, { data: prog }] = await Promise.all([
        supabase.from("projects").select("id,name").order("name"),
        projectId
          ? supabase.from("progress_entries").select("id,title,reported_at").eq("project_id", projectId).order("reported_at", { ascending: false }).limit(20)
          : Promise.resolve({ data: [] }),
      ]);
      return { prjs: prjs ?? [], prog: prog ?? [] };
    },
  });

  const reset = () => {
    setProjectId(""); setProgressId(""); setTitle(""); setDescription("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!orgId || !projectId) { toast.error("Proyecto requerido"); return; }
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("Selecciona un archivo"); return; }
    setUploading(true);
    try {
      const kind: Evidence["kind"] = file.type.startsWith("image/") ? "foto" : file.type.startsWith("video/") ? "video" : "documento";
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${orgId}/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("evidences").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData, error: urlErr } = await supabase.storage.from("evidences").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (urlErr) throw urlErr;
      const file_url = urlData?.signedUrl ?? "";
      const { error } = await supabase.from("evidences").insert({
        organization_id: orgId,
        project_id: projectId,
        progress_entry_id: progressId || null,
        kind,
        title: title || file.name,
        description: description || null,
        file_url,
        file_path: path,
        mime_type: file.type,
        uploaded_by: user?.id ?? null,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["production"] });
      toast.success("Evidencia subida");
      setOpen(false);
      reset();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Upload className="h-3.5 w-3.5 mr-1.5" /> Subir evidencia
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Subir evidencia</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 mt-6">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setProgressId(""); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>{(refs?.prjs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Avance relacionado</Label>
            <Select value={progressId} onValueChange={setProgressId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>{(refs?.prog ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.reported_at} · {p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={2} />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Archivo (foto, video, documento)</Label>
            <input ref={fileRef} type="file" accept="image/*,video/*,application/pdf" className="mt-1.5 block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary/20 file:text-primary file:font-mono file:uppercase file:tracking-wider file:text-[10px]" />
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Subiendo…</> : "Subir"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== TIMELINE ============== */
function TimelineTab({ orgId }: { orgId?: string | null }) {
  const { data: events = [] } = useQuery({
    queryKey: ["production", "timeline", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: prog }, { data: evs }, { data: movs }, { data: prjs }] = await Promise.all([
        supabase.from("progress_entries").select("id,title,reported_at,created_at,progress_pct,project_id").order("created_at", { ascending: false }).limit(30),
        supabase.from("evidences").select("id,title,kind,created_at,project_id").order("created_at", { ascending: false }).limit(30),
        supabase.from("warehouse_movements").select("id,movement_type,quantity,created_at,material_id,project_id").order("created_at", { ascending: false }).limit(30),
        supabase.from("projects").select("id,name"),
      ]);
      const pmap = new Map((prjs ?? []).map((p) => [p.id, p.name]));
      const mapped: { id: string; ts: string; type: string; title: string; project: string; meta?: string }[] = [];
      (prog ?? []).forEach((p) => mapped.push({ id: `p-${p.id}`, ts: p.created_at, type: "avance", title: p.title, project: pmap.get(p.project_id) ?? "—", meta: `${Number(p.progress_pct).toFixed(0)}%` }));
      (evs ?? []).forEach((e) => mapped.push({ id: `e-${e.id}`, ts: e.created_at, type: `evidencia · ${e.kind}`, title: e.title ?? "Evidencia", project: pmap.get(e.project_id) ?? "—" }));
      (movs ?? []).forEach((m) => mapped.push({ id: `m-${m.id}`, ts: m.created_at, type: `almacén · ${m.movement_type}`, title: `Movimiento ${m.movement_type}`, project: m.project_id ? pmap.get(m.project_id) ?? "—" : "Almacén", meta: `${Number(m.quantity).toFixed(2)} u` }));
      return mapped.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 60);
    },
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={e.id} className="flex gap-4 relative pb-3">
            {i !== events.length - 1 && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-white/[0.06]" />}
            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0 relative z-10 ring-4 ring-[#0a0d12]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary">{e.type}</span>
                <span className="text-[10px] font-mono text-muted-foreground">{new Date(e.ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
                {e.meta && <Badge variant="outline" className="text-[10px] font-mono border-white/10">{e.meta}</Badge>}
              </div>
              <div className="text-sm mt-0.5">{e.title}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{e.project}</div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="text-center py-12">
            <ActivityIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Sin actividad reciente</p>
          </div>
        )}
      </div>
    </div>
  );
}
