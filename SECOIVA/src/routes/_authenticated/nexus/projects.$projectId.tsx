import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, MapPin, DollarSign, ShieldCheck, HardHat, Factory,
  CheckCircle2, Plus, FileText, Users,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planeacion: "Planeación", en_curso: "Activo", pausado: "Pausado",
  completado: "Finalizado", cancelado: "Cancelado",
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/_authenticated/nexus/projects/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      let client = null;
      if (data.client_id) {
        const { data: c } = await supabase.from("clients").select("id,name,city").eq("id", data.client_id).maybeSingle();
        client = c;
      }
      return { ...data, client };
    },
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["project", projectId, "milestones"],
    queryFn: async () => {
      const { data } = await supabase.from("project_milestones").select("*").eq("project_id", projectId).order("order_idx");
      return data ?? [];
    },
  });

  const { data: team = [] } = useQuery({
    queryKey: ["project", projectId, "team"],
    queryFn: async () => {
      const { data } = await supabase.from("project_team").select("*").eq("project_id", projectId);
      return data ?? [];
    },
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["project", projectId, "docs"],
    queryFn: async () => {
      const { data } = await supabase.from("project_documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: ProjectStatus) => {
      const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Estatus actualizado");
    },
  });

  const updateProgress = useMutation({
    mutationFn: async (pct: number) => {
      const { error } = await supabase.from("projects").update({ progress_pct: pct }).eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId] }),
  });

  const [newMilestone, setNewMilestone] = useState("");
  const addMilestone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_milestones").insert({
        project_id: projectId, name: newMilestone, order_idx: milestones.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "milestones"] });
      setNewMilestone("");
    },
  });

  const toggleMilestone = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("project_milestones").update({
        completed, completed_at: completed ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", projectId, "milestones"] }),
  });

  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docCategory, setDocCategory] = useState("");
  const addDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("project_documents").insert({
        project_id: projectId, name: docName, file_url: docUrl || null,
        category: docCategory || null, uploaded_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId, "docs"] });
      setDocName(""); setDocUrl(""); setDocCategory("");
      toast.success("Documento agregado");
    },
  });

  if (!project) {
    return (
      <div className="p-8 text-sm text-muted-foreground">Cargando proyecto…</div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <div>
        <Link to="/nexus/projects" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Proyectos
        </Link>
      </div>

      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          {project.code && <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary">{project.code}</div>}
          <h1 className="mt-1 text-3xl lg:text-4xl font-bold tracking-tight">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {project.client && <span>{project.client.name}</span>}
            {project.location && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{project.location}</span>}
            {project.start_date && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{project.start_date} → {project.end_date ?? "—"}</span>}
          </div>
        </div>
        <Select value={project.status} onValueChange={(v) => updateStatus.mutate(v as ProjectStatus)}>
          <SelectTrigger className="w-44 font-mono text-xs uppercase tracking-wider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Avance" value={`${Number(project.progress_pct ?? 0).toFixed(0)}%`} />
        <KPI label="Presupuesto" value={project.budget ? fmtMoney(Number(project.budget)) : "—"} />
        <KPI label="Hitos" value={`${milestones.filter((m) => m.completed).length}/${milestones.length}`} />
        <KPI label="Equipo" value={String(team.length)} />
      </section>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 h-auto">
          {[
            { v: "overview", l: "Overview" },
            { v: "milestones", l: "Hitos" },
            { v: "team", l: "Equipo" },
            { v: "docs", l: "Documentos" },
            { v: "modules", l: "Módulos" },
          ].map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="font-mono text-[11px] tracking-[0.12em] uppercase">{t.l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Avance del proyecto</h3>
            <div className="flex items-center gap-4">
              <Progress value={Number(project.progress_pct ?? 0)} className="flex-1 h-2" />
              <Input
                type="number" min={0} max={100}
                defaultValue={Number(project.progress_pct ?? 0)}
                onBlur={(e) => updateProgress.mutate(Number(e.target.value))}
                className="w-20 font-mono"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          {project.description && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Descripción</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="mt-6 space-y-3">
          <div className="flex gap-2">
            <Input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)} placeholder="Nuevo hito…" />
            <Button onClick={() => addMilestone.mutate()} disabled={!newMilestone}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {milestones.map((m) => (
              <div key={m.id} className="p-3 flex items-center gap-3">
                <button
                  onClick={() => toggleMilestone.mutate({ id: m.id, completed: !m.completed })}
                  className={`h-5 w-5 rounded border flex items-center justify-center ${m.completed ? "bg-primary border-primary" : "border-white/20"}`}
                >
                  {m.completed && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </button>
                <span className={`text-sm flex-1 ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.name}</span>
                {m.due_date && <span className="text-[10px] font-mono text-muted-foreground">{m.due_date}</span>}
              </div>
            ))}
            {milestones.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sin hitos</div>}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            Gestión de equipo del proyecto. Asignación de roles próximamente desde HR.
          </div>
        </TabsContent>

        <TabsContent value="docs" className="mt-6 space-y-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Nombre" />
            <Input value={docCategory} onChange={(e) => setDocCategory(e.target.value)} placeholder="Categoría" />
            <Input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="URL" />
            <Button onClick={() => addDoc.mutate()} disabled={!docName}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {docs.map((d) => (
              <a key={d.id} href={d.file_url ?? "#"} target="_blank" rel="noreferrer" className="p-3 flex items-center gap-3 hover:bg-white/[0.02]">
                <FileText className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <div className="text-sm">{d.name}</div>
                  {d.category && <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{d.category}</div>}
                </div>
              </a>
            ))}
            {docs.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Sin documentos</div>}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { i: Factory, l: "Production", d: "Avance físico, partidas, productividad" },
              { i: ShieldCheck, l: "Quality", d: "Inspecciones y no conformidades" },
              { i: HardHat, l: "Safety", d: "Incidentes y permisos HSE" },
              { i: DollarSign, l: "Finance", d: "Presupuesto, estimaciones y costos" },
            ].map((m) => (
              <div key={m.l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <m.i className="h-5 w-5 text-primary" />
                <div className="mt-2 font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">{m.l}</div>
                <p className="text-xs text-foreground/80 mt-1">{m.d}</p>
                <div className="mt-2 text-[10px] font-mono text-primary">● sincronizado</div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold font-mono">{value}</div>
    </div>
  );
}
