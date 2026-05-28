import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldCheck, Plus, ClipboardCheck, AlertOctagon, FileText, CheckCircle2,
  XCircle, Clock,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Inspection = Database["public"]["Tables"]["inspections"]["Row"];
type NC = Database["public"]["Tables"]["non_conformities"]["Row"];
type QDoc = Database["public"]["Tables"]["quality_documents"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

type OrgId = string | null | undefined;

const INSPECTION_STATUS = [
  { id: "pendiente", label: "Pendiente", color: "bg-slate-500/15 text-slate-300 border-slate-400/30", icon: Clock },
  { id: "en_proceso", label: "En proceso", color: "bg-amber-500/15 text-amber-300 border-amber-400/30", icon: Clock },
  { id: "liberada", label: "Liberada", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30", icon: CheckCircle2 },
  { id: "rechazada", label: "Rechazada", color: "bg-rose-500/15 text-rose-300 border-rose-400/30", icon: XCircle },
] as const;

const NC_SEVERITY = [
  { id: "menor", label: "Menor", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "mayor", label: "Mayor", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "critica", label: "Crítica", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
] as const;

const NC_STATUS = [
  { id: "abierta", label: "Abierta", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "en_accion", label: "En acción", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "verificacion", label: "Verificación", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "cerrada", label: "Cerrada", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
] as const;

export const Route = createFileRoute("/_authenticated/nexus/quality")({
  component: QualityPage,
});

function useProjectsMap(orgId: OrgId) {
  return useQuery({
    queryKey: ["projects-mini", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id,name,code").eq("organization_id", orgId!);
      const list = (data ?? []) as Pick<Project, "id" | "name" | "code">[];
      const map = new Map(list.map((p) => [p.id, p]));
      return { list, map };
    },
  });
}

function QualityPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            05 · QUALITY · ISO 9001
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-7 w-7 text-primary" /> Control de Calidad
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inspecciones, no conformidades, acciones correctivas y control documental — sincronizado con cada proyecto.
          </p>
        </div>
        <KpisStrip orgId={orgId} />
      </header>

      <Tabs defaultValue="inspections" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-2xl bg-card/60 border border-border/40">
          <TabsTrigger value="inspections"><ClipboardCheck className="h-4 w-4 mr-2" />Inspecciones</TabsTrigger>
          <TabsTrigger value="ncs"><AlertOctagon className="h-4 w-4 mr-2" />No Conformidades</TabsTrigger>
          <TabsTrigger value="docs"><FileText className="h-4 w-4 mr-2" />Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="mt-6"><InspectionsTab orgId={orgId} /></TabsContent>
        <TabsContent value="ncs" className="mt-6"><NCsTab orgId={orgId} /></TabsContent>
        <TabsContent value="docs" className="mt-6"><DocsTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function KpisStrip({ orgId }: { orgId: OrgId }) {
  const { data } = useQuery({
    queryKey: ["quality-kpis", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [ins, nc] = await Promise.all([
        supabase.from("inspections").select("status").eq("organization_id", orgId!),
        supabase.from("non_conformities").select("status,severity").eq("organization_id", orgId!),
      ]);
      const insRows = (ins.data ?? []) as { status: string }[];
      const ncRows = (nc.data ?? []) as { status: string; severity: string }[];
      return {
        pendientes: insRows.filter((r) => r.status === "pendiente" || r.status === "en_proceso").length,
        liberadas: insRows.filter((r) => r.status === "liberada").length,
        ncAbiertas: ncRows.filter((r) => r.status !== "cerrada").length,
        ncCriticas: ncRows.filter((r) => r.severity === "critica" && r.status !== "cerrada").length,
      };
    },
  });

  const items = [
    { label: "Insp. activas", value: data?.pendientes ?? 0, tint: "text-amber-300" },
    { label: "Liberadas", value: data?.liberadas ?? 0, tint: "text-emerald-300" },
    { label: "NC abiertas", value: data?.ncAbiertas ?? 0, tint: "text-rose-300" },
    { label: "NC críticas", value: data?.ncCriticas ?? 0, tint: "text-rose-400" },
  ];

  return (
    <div className="flex gap-2">
      {items.map((it) => (
        <div key={it.label} className="px-4 py-3 rounded-xl bg-card/60 border border-border/40 min-w-[110px]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{it.label}</div>
          <div className={`text-2xl font-bold mt-1 tabular-nums ${it.tint}`}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

function InspectionsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { data: projData } = useProjectsMap(orgId);
  const projects = projData?.list ?? [];
  const projMap = projData?.map;

  const { data: inspections = [] } = useQuery({
    queryKey: ["inspections", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inspections").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inspection[];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { title: string; project_id: string | null; inspection_type: string; scheduled_date: string | null; description: string }) => {
      const { error } = await supabase.from("inspections").insert({
        organization_id: orgId!,
        title: payload.title,
        project_id: payload.project_id,
        inspection_type: payload.inspection_type,
        scheduled_date: payload.scheduled_date,
        description: payload.description,
        inspector_id: profile?.id,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", orgId] });
      qc.invalidateQueries({ queryKey: ["quality-kpis", orgId] });
      toast.success("Inspección creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("inspections").update({
        status: status as Inspection["status"],
        performed_date: status === "liberada" || status === "rechazada" ? new Date().toISOString().slice(0, 10) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", orgId] });
      qc.invalidateQueries({ queryKey: ["quality-kpis", orgId] });
    },
  });

  const filtered = filter === "all" ? inspections : inspections.filter((i) => i.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Todas</Button>
          {INSPECTION_STATUS.map((s) => (
            <Button key={s.id} size="sm" variant={filter === s.id ? "default" : "outline"} onClick={() => setFilter(s.id)}>{s.label}</Button>
          ))}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva inspección</Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader><SheetTitle>Nueva inspección</SheetTitle></SheetHeader>
            <form
              className="space-y-4 mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                create.mutate({
                  title: String(f.get("title") ?? ""),
                  project_id: (f.get("project_id") as string) || null,
                  inspection_type: String(f.get("inspection_type") ?? "general"),
                  scheduled_date: (f.get("scheduled_date") as string) || null,
                  description: String(f.get("description") ?? ""),
                });
              }}
            >
              <div><Label>Título</Label><Input name="title" required /></div>
              <div>
                <Label>Proyecto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Tipo</Label><Input name="inspection_type" defaultValue="general" placeholder="soldadura, dimensional, recubrimiento…" /></div>
              <div><Label>Fecha programada</Label><Input type="date" name="scheduled_date" /></div>
              <div><Label>Descripción</Label><Textarea name="description" rows={3} /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creando…" : "Crear"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            No hay inspecciones registradas.
          </div>
        )}
        {filtered.map((i) => {
          const s = INSPECTION_STATUS.find((x) => x.id === i.status)!;
          const Icon = s.icon;
          const proj = i.project_id ? projMap?.get(i.project_id) : null;
          return (
            <div key={i.id} className="rounded-xl bg-card/60 border border-border/40 p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="text-primary">{i.folio}</span>
                    {i.inspection_type && <span>· {i.inspection_type}</span>}
                    {proj && <span>· {proj.name}</span>}
                  </div>
                  <h3 className="text-base font-semibold mt-1">{i.title}</h3>
                  {i.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.description}</p>}
                  <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                    Programada: {i.scheduled_date ?? "—"} {i.performed_date && `· Realizada: ${i.performed_date}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${s.color} border`}><Icon className="h-3 w-3 mr-1" />{s.label}</Badge>
                  <Select value={i.status} onValueChange={(v) => setStatus.mutate({ id: i.id, status: v })}>
                    <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{INSPECTION_STATUS.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NCsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: projData } = useProjectsMap(orgId);
  const projects = projData?.list ?? [];
  const projMap = projData?.map;

  const { data: ncs = [] } = useQuery({
    queryKey: ["ncs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("non_conformities").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as NC[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: { title: string; description: string; severity: string; project_id: string | null }) => {
      const { error } = await supabase.from("non_conformities").insert({
        organization_id: orgId!,
        title: p.title,
        description: p.description,
        severity: p.severity as NC["severity"],
        project_id: p.project_id,
        detected_by: profile?.id,
        responsible_id: profile?.id,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs", orgId] });
      qc.invalidateQueries({ queryKey: ["quality-kpis", orgId] });
      toast.success("NC registrada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("non_conformities").update({
        status: status as NC["status"],
        closed_at: status === "cerrada" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ncs", orgId] });
      qc.invalidateQueries({ queryKey: ["quality-kpis", orgId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{ncs.length} no conformidades registradas</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nueva NC</Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader><SheetTitle>Registrar no conformidad</SheetTitle></SheetHeader>
            <form className="space-y-4 mt-6" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              create.mutate({
                title: String(f.get("title") ?? ""),
                description: String(f.get("description") ?? ""),
                severity: String(f.get("severity") ?? "menor"),
                project_id: (f.get("project_id") as string) || null,
              });
            }}>
              <div><Label>Título</Label><Input name="title" required /></div>
              <div>
                <Label>Severidad</Label>
                <Select name="severity" defaultValue="menor">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NC_SEVERITY.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Textarea name="description" rows={4} /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Guardando…" : "Registrar"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {ncs.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            Sin no conformidades. La operación está limpia.
          </div>
        )}
        {ncs.map((n) => {
          const sev = NC_SEVERITY.find((x) => x.id === n.severity)!;
          const st = NC_STATUS.find((x) => x.id === n.status)!;
          const proj = n.project_id ? projMap?.get(n.project_id) : null;
          return (
            <div key={n.id} className="rounded-xl bg-card/60 border border-border/40 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="text-primary">{n.folio}</span>
                    {proj && <span>· {proj.name}</span>}
                    <span>· Detectada {n.detected_at}</span>
                  </div>
                  <h3 className="text-base font-semibold mt-1">{n.title}</h3>
                  {n.description && <p className="text-xs text-muted-foreground mt-1">{n.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${sev.color} border`}>{sev.label}</Badge>
                  <Badge className={`${st.color} border`}>{st.label}</Badge>
                  <Select value={n.status} onValueChange={(v) => setStatus.mutate({ id: n.id, status: v })}>
                    <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{NC_STATUS.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DocsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["q-docs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quality_documents").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as QDoc[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: { name: string; category: string; version: string; file_url: string; notes: string }) => {
      const { error } = await supabase.from("quality_documents").insert({
        organization_id: orgId!,
        name: p.name, category: p.category, version: p.version, file_url: p.file_url, notes: p.notes,
        uploaded_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["q-docs", orgId] });
      toast.success("Documento agregado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleApprove = useMutation({
    mutationFn: async (d: QDoc) => {
      const { error } = await supabase.from("quality_documents").update({
        approved: !d.approved,
        approved_by: !d.approved ? profile?.id : null,
        approved_at: !d.approved ? new Date().toISOString() : null,
      }).eq("id", d.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["q-docs", orgId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{docs.length} documentos controlados</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo documento</Button></SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader><SheetTitle>Agregar documento</SheetTitle></SheetHeader>
            <form className="space-y-4 mt-6" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              create.mutate({
                name: String(f.get("name") ?? ""),
                category: String(f.get("category") ?? ""),
                version: String(f.get("version") ?? "v1"),
                file_url: String(f.get("file_url") ?? ""),
                notes: String(f.get("notes") ?? ""),
              });
            }}>
              <div><Label>Nombre</Label><Input name="name" required /></div>
              <div><Label>Categoría</Label><Input name="category" placeholder="procedimiento, plano, certificado…" /></div>
              <div><Label>Versión</Label><Input name="version" defaultValue="v1" /></div>
              <div><Label>URL del archivo</Label><Input name="file_url" type="url" placeholder="https://…" /></div>
              <div><Label>Notas</Label><Textarea name="notes" rows={3} /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Guardando…" : "Agregar"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-2">
        {docs.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            Sin documentos controlados todavía.
          </div>
        )}
        {docs.map((d) => (
          <div key={d.id} className="rounded-xl bg-card/60 border border-border/40 p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">
                  {d.category ?? "—"} · {d.version} · {new Date(d.created_at).toLocaleDateString("es-MX")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Ver</a>}
              <Badge className={d.approved ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30 border" : "bg-slate-500/15 text-slate-300 border-slate-400/30 border"}>
                {d.approved ? "Aprobado" : "Pendiente"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => toggleApprove.mutate(d)}>
                {d.approved ? "Revocar" : "Aprobar"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
