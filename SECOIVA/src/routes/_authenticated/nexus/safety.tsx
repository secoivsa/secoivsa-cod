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
  HardHat, Plus, FileWarning, AlertTriangle, CheckCircle2, ShieldAlert,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Permit = Database["public"]["Tables"]["work_permits"]["Row"];
type Incident = Database["public"]["Tables"]["incidents"]["Row"];
type Validation = Database["public"]["Tables"]["safety_validations"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

type OrgId = string | null | undefined;

const PERMIT_TYPES = [
  { id: "altura", label: "Trabajo en altura" },
  { id: "caliente", label: "Trabajo en caliente" },
  { id: "electrico", label: "Eléctrico" },
  { id: "excavacion", label: "Excavación" },
  { id: "espacio_confinado", label: "Espacio confinado" },
  { id: "izaje", label: "Izaje" },
  { id: "quimicos", label: "Químicos" },
  { id: "general", label: "General" },
] as const;

const PERMIT_STATUS = [
  { id: "borrador", label: "Borrador", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "en_revision", label: "En revisión", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "aprobado", label: "Aprobado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "rechazado", label: "Rechazado", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "cerrado", label: "Cerrado", color: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
] as const;

const INCIDENT_SEVERITY = [
  { id: "casi_accidente", label: "Casi accidente", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "leve", label: "Leve", color: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30" },
  { id: "moderado", label: "Moderado", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "grave", label: "Grave", color: "bg-orange-500/15 text-orange-300 border-orange-400/30" },
  { id: "fatal", label: "Fatal", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
] as const;

const INCIDENT_STATUS = [
  { id: "reportado", label: "Reportado", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "investigacion", label: "Investigación", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "accion", label: "Acción", color: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30" },
  { id: "cerrado", label: "Cerrado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
] as const;

export const Route = createFileRoute("/_authenticated/nexus/safety")({
  component: SafetyPage,
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

function SafetyPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            06 · SAFETY · ISO 45001
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <HardHat className="h-7 w-7 text-primary" /> Seguridad Industrial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Permisos de trabajo, incidentes y validaciones operativas — sincronizado con producción y proyectos.
          </p>
        </div>
        <KpisStrip orgId={orgId} />
      </header>

      <Tabs defaultValue="permits" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-2xl bg-card/60 border border-border/40">
          <TabsTrigger value="permits"><FileWarning className="h-4 w-4 mr-2" />Permisos</TabsTrigger>
          <TabsTrigger value="incidents"><AlertTriangle className="h-4 w-4 mr-2" />Incidentes</TabsTrigger>
          <TabsTrigger value="validations"><CheckCircle2 className="h-4 w-4 mr-2" />Validaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="mt-6"><PermitsTab orgId={orgId} /></TabsContent>
        <TabsContent value="incidents" className="mt-6"><IncidentsTab orgId={orgId} /></TabsContent>
        <TabsContent value="validations" className="mt-6"><ValidationsTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

function KpisStrip({ orgId }: { orgId: OrgId }) {
  const { data } = useQuery({
    queryKey: ["safety-kpis", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [pe, inc] = await Promise.all([
        supabase.from("work_permits").select("status").eq("organization_id", orgId!),
        supabase.from("incidents").select("status,severity").eq("organization_id", orgId!),
      ]);
      const permits = (pe.data ?? []) as { status: string }[];
      const incidents = (inc.data ?? []) as { status: string; severity: string }[];
      return {
        permisosActivos: permits.filter((p) => p.status === "aprobado" || p.status === "en_revision").length,
        incidentes: incidents.filter((i) => i.status !== "cerrado").length,
        graves: incidents.filter((i) => (i.severity === "grave" || i.severity === "fatal") && i.status !== "cerrado").length,
        cerrados: incidents.filter((i) => i.status === "cerrado").length,
      };
    },
  });

  const items = [
    { label: "Permisos activos", value: data?.permisosActivos ?? 0, tint: "text-emerald-300" },
    { label: "Incidentes", value: data?.incidentes ?? 0, tint: "text-amber-300" },
    { label: "Graves/fatales", value: data?.graves ?? 0, tint: "text-rose-400" },
    { label: "Cerrados", value: data?.cerrados ?? 0, tint: "text-slate-300" },
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

function PermitsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: projData } = useProjectsMap(orgId);
  const projects = projData?.list ?? [];
  const projMap = projData?.map;

  const { data: permits = [] } = useQuery({
    queryKey: ["permits", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_permits").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Permit[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: { title: string; permit_type: string; project_id: string | null; location: string; hazards: string; controls: string; ppe: string; valid_from: string | null; valid_to: string | null }) => {
      const { error } = await supabase.from("work_permits").insert({
        organization_id: orgId!,
        title: p.title,
        permit_type: p.permit_type as Permit["permit_type"],
        project_id: p.project_id,
        location: p.location,
        hazards: p.hazards,
        controls: p.controls,
        ppe: p.ppe,
        valid_from: p.valid_from,
        valid_to: p.valid_to,
        requested_by: profile?.id,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permits", orgId] });
      qc.invalidateQueries({ queryKey: ["safety-kpis", orgId] });
      toast.success("Permiso creado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const update: Partial<Permit> = { status: status as Permit["status"] };
      if (status === "aprobado") { update.approved_by = profile?.id; update.approved_at = new Date().toISOString(); }
      if (status === "cerrado") { update.closed_at = new Date().toISOString(); }
      const { error } = await supabase.from("work_permits").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["permits", orgId] });
      qc.invalidateQueries({ queryKey: ["safety-kpis", orgId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{permits.length} permisos de trabajo</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo permiso</Button></SheetTrigger>
          <SheetContent className="bg-card border-border overflow-y-auto">
            <SheetHeader><SheetTitle>Permiso de trabajo seguro</SheetTitle></SheetHeader>
            <form className="space-y-3 mt-6" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              create.mutate({
                title: String(f.get("title") ?? ""),
                permit_type: String(f.get("permit_type") ?? "general"),
                project_id: (f.get("project_id") as string) || null,
                location: String(f.get("location") ?? ""),
                hazards: String(f.get("hazards") ?? ""),
                controls: String(f.get("controls") ?? ""),
                ppe: String(f.get("ppe") ?? ""),
                valid_from: (f.get("valid_from") as string) || null,
                valid_to: (f.get("valid_to") as string) || null,
              });
            }}>
              <div><Label>Título</Label><Input name="title" required /></div>
              <div>
                <Label>Tipo</Label>
                <Select name="permit_type" defaultValue="general">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PERMIT_TYPES.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ubicación</Label><Input name="location" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Válido desde</Label><Input type="datetime-local" name="valid_from" /></div>
                <div><Label>Válido hasta</Label><Input type="datetime-local" name="valid_to" /></div>
              </div>
              <div><Label>Riesgos identificados</Label><Textarea name="hazards" rows={2} /></div>
              <div><Label>Controles</Label><Textarea name="controls" rows={2} /></div>
              <div><Label>EPP requerido</Label><Textarea name="ppe" rows={2} /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creando…" : "Crear permiso"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {permits.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            Sin permisos registrados.
          </div>
        )}
        {permits.map((p) => {
          const st = PERMIT_STATUS.find((x) => x.id === p.status)!;
          const tp = PERMIT_TYPES.find((x) => x.id === p.permit_type)!;
          const proj = p.project_id ? projMap?.get(p.project_id) : null;
          return (
            <div key={p.id} className="rounded-xl bg-card/60 border border-border/40 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <span className="text-primary">{p.folio}</span>
                    <span>· {tp.label}</span>
                    {proj && <span>· {proj.name}</span>}
                  </div>
                  <h3 className="text-base font-semibold mt-1">{p.title}</h3>
                  {p.location && <p className="text-xs text-muted-foreground mt-1">📍 {p.location}</p>}
                  <div className="text-[11px] text-muted-foreground mt-2 font-mono">
                    {p.valid_from && `Vigencia: ${new Date(p.valid_from).toLocaleString("es-MX")} → ${p.valid_to ? new Date(p.valid_to).toLocaleString("es-MX") : "—"}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${st.color} border`}>{st.label}</Badge>
                  <Select value={p.status} onValueChange={(v) => setStatus.mutate({ id: p.id, status: v })}>
                    <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{PERMIT_STATUS.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
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

function IncidentsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: projData } = useProjectsMap(orgId);
  const projects = projData?.list ?? [];
  const projMap = projData?.map;

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incidents").select("*").eq("organization_id", orgId!).order("occurred_at", { ascending: false });
      if (error) throw error;
      return data as Incident[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: { title: string; description: string; severity: string; project_id: string | null; location: string; injured_person: string }) => {
      const { error } = await supabase.from("incidents").insert({
        organization_id: orgId!,
        title: p.title, description: p.description,
        severity: p.severity as Incident["severity"],
        project_id: p.project_id,
        location: p.location,
        injured_person: p.injured_person || null,
        reported_by: profile?.id,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", orgId] });
      qc.invalidateQueries({ queryKey: ["safety-kpis", orgId] });
      toast.success("Incidente registrado");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("incidents").update({
        status: status as Incident["status"],
        closed_at: status === "cerrado" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incidents", orgId] });
      qc.invalidateQueries({ queryKey: ["safety-kpis", orgId] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{incidents.length} incidentes registrados</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Reportar incidente</Button></SheetTrigger>
          <SheetContent className="bg-card border-border overflow-y-auto">
            <SheetHeader><SheetTitle>Reportar incidente</SheetTitle></SheetHeader>
            <form className="space-y-3 mt-6" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              create.mutate({
                title: String(f.get("title") ?? ""),
                description: String(f.get("description") ?? ""),
                severity: String(f.get("severity") ?? "casi_accidente"),
                project_id: (f.get("project_id") as string) || null,
                location: String(f.get("location") ?? ""),
                injured_person: String(f.get("injured_person") ?? ""),
              });
            }}>
              <div><Label>Título</Label><Input name="title" required /></div>
              <div>
                <Label>Severidad</Label>
                <Select name="severity" defaultValue="casi_accidente">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INCIDENT_SEVERITY.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ubicación</Label><Input name="location" /></div>
              <div><Label>Persona afectada (opcional)</Label><Input name="injured_person" /></div>
              <div><Label>Descripción del evento</Label><Textarea name="description" rows={4} required /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Guardando…" : "Reportar"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-3">
        {incidents.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            Sin incidentes. Mantén la operación segura.
          </div>
        )}
        {incidents.map((i) => {
          const sv = INCIDENT_SEVERITY.find((x) => x.id === i.severity)!;
          const st = INCIDENT_STATUS.find((x) => x.id === i.status)!;
          const proj = i.project_id ? projMap?.get(i.project_id) : null;
          return (
            <div key={i.id} className="rounded-xl bg-card/60 border border-border/40 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <ShieldAlert className="h-3 w-3 text-primary" />
                    <span className="text-primary">{i.folio}</span>
                    {proj && <span>· {proj.name}</span>}
                    <span>· {new Date(i.occurred_at).toLocaleString("es-MX")}</span>
                  </div>
                  <h3 className="text-base font-semibold mt-1">{i.title}</h3>
                  {i.description && <p className="text-xs text-muted-foreground mt-1">{i.description}</p>}
                  {i.injured_person && <p className="text-xs text-rose-300 mt-1">Afectado: {i.injured_person}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${sv.color} border`}>{sv.label}</Badge>
                  <Badge className={`${st.color} border`}>{st.label}</Badge>
                  <Select value={i.status} onValueChange={(v) => setStatus.mutate({ id: i.id, status: v })}>
                    <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{INCIDENT_STATUS.map((x) => <SelectItem key={x.id} value={x.id}>{x.label}</SelectItem>)}</SelectContent>
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

function ValidationsTab({ orgId }: { orgId: OrgId }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: projData } = useProjectsMap(orgId);
  const projects = projData?.list ?? [];
  const projMap = projData?.map;

  const { data: validations = [] } = useQuery({
    queryKey: ["validations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_validations").select("*").eq("organization_id", orgId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Validation[];
    },
  });

  const create = useMutation({
    mutationFn: async (p: { title: string; notes: string; project_id: string | null }) => {
      const { error } = await supabase.from("safety_validations").insert({
        organization_id: orgId!,
        title: p.title, notes: p.notes, project_id: p.project_id,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validations", orgId] });
      toast.success("Validación creada");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (v: Validation) => {
      const { error } = await supabase.from("safety_validations").update({
        validated: !v.validated,
        validated_by: !v.validated ? profile?.id : null,
        validated_at: !v.validated ? new Date().toISOString() : null,
      }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["validations", orgId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{validations.length} validaciones de seguridad</p>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nueva validación</Button></SheetTrigger>
          <SheetContent className="bg-card border-border">
            <SheetHeader><SheetTitle>Validación de seguridad</SheetTitle></SheetHeader>
            <form className="space-y-4 mt-6" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              create.mutate({
                title: String(f.get("title") ?? ""),
                notes: String(f.get("notes") ?? ""),
                project_id: (f.get("project_id") as string) || null,
              });
            }}>
              <div><Label>Título</Label><Input name="title" required /></div>
              <div>
                <Label>Proyecto</Label>
                <Select name="project_id">
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Notas / criterios</Label><Textarea name="notes" rows={4} /></div>
              <SheetFooter><Button type="submit" disabled={create.isPending}>{create.isPending ? "Guardando…" : "Crear"}</Button></SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-2">
        {validations.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/40 text-muted-foreground text-sm">
            Sin validaciones registradas.
          </div>
        )}
        {validations.map((v) => {
          const proj = v.project_id ? projMap?.get(v.project_id) : null;
          return (
            <div key={v.id} className="rounded-xl bg-card/60 border border-border/40 p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {proj ? `${proj.name} · ` : ""}{new Date(v.created_at).toLocaleDateString("es-MX")}
                </div>
                <div className="text-sm font-medium mt-1">{v.title}</div>
                {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={v.validated ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30 border" : "bg-amber-500/15 text-amber-300 border-amber-400/30 border"}>
                  {v.validated ? "Validado" : "Pendiente"}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => toggle.mutate(v)}>
                  {v.validated ? "Revocar" : "Validar"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
