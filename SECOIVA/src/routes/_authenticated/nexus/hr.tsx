import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { toast } from "sonner";
import {
  Users, Plus, Clock, FileText, Plane, Briefcase,
  AlertTriangle, CheckCircle2, UserPlus, Calendar,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
type EmpDoc = Database["public"]["Tables"]["employee_documents"]["Row"];
type Assignment = Database["public"]["Tables"]["employee_assignments"]["Row"];
type Vacation = Database["public"]["Tables"]["vacation_requests"]["Row"];

const DOC_KINDS = [
  { id: "ine", label: "INE" }, { id: "contrato", label: "Contrato" },
  { id: "dc3", label: "DC-3" }, { id: "certificacion", label: "Certificación" },
  { id: "curp_doc", label: "CURP" }, { id: "rfc_doc", label: "RFC" },
  { id: "nss_doc", label: "NSS" }, { id: "poliza", label: "Póliza" },
  { id: "otro", label: "Otro" },
] as const;

const ATT_STATUS = [
  { id: "presente", label: "Presente", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "retardo", label: "Retardo", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "falta", label: "Falta", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "incapacidad", label: "Incapacidad", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "vacaciones", label: "Vacaciones", color: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
] as const;

const VAC_STATUS = [
  { id: "solicitada", label: "Solicitada", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "aprobada", label: "Aprobada", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "rechazada", label: "Rechazada", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "disfrutada", label: "Disfrutada", color: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
] as const;

export const Route = createFileRoute("/_authenticated/nexus/hr")({
  component: HrPage,
});

function HrPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? undefined;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            08 · HR · workforce management
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" /> Gestión de personal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Expedientes digitales, asistencia diaria, asignaciones por proyecto y control de vacaciones.
          </p>
        </div>
        <HrKpis orgId={orgId} />
      </header>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="bg-white/[0.02] border border-white/[0.06]">
          <TabsTrigger value="employees"><UserPlus className="h-3.5 w-3.5 mr-1.5" />Empleados</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="h-3.5 w-3.5 mr-1.5" />Asistencia</TabsTrigger>
          <TabsTrigger value="assignments"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Asignaciones</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1.5" />Documentos</TabsTrigger>
          <TabsTrigger value="vacations"><Plane className="h-3.5 w-3.5 mr-1.5" />Vacaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6"><EmployeesTab orgId={orgId} /></TabsContent>
        <TabsContent value="attendance" className="mt-6"><AttendanceTab orgId={orgId} /></TabsContent>
        <TabsContent value="assignments" className="mt-6"><AssignmentsTab orgId={orgId} /></TabsContent>
        <TabsContent value="documents" className="mt-6"><DocumentsTab orgId={orgId} /></TabsContent>
        <TabsContent value="vacations" className="mt-6"><VacationsTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================ KPI STRIP ============================
function HrKpis({ orgId }: { orgId?: string }) {
  const { data } = useQuery({
    queryKey: ["hr", "kpis", orgId],
    enabled: !!orgId,
    refetchInterval: 30000,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const [emp, att, docs, vac] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "activo"),
        supabase.from("attendance").select("id, status").eq("date", today),
        supabase.from("employee_documents").select("id, expires_at").not("expires_at", "is", null).lte("expires_at", in30),
        supabase.from("vacation_requests").select("id, status").eq("status", "solicitada"),
      ]);
      const attArr = att.data ?? [];
      return {
        activos: emp.count ?? 0,
        presentes: attArr.filter((a: any) => a.status === "presente" || a.status === "retardo").length,
        registros: attArr.length,
        vencimientos: (docs.data ?? []).length,
        vacacionesPendientes: (vac.data ?? []).length,
      };
    },
  });

  const kpis = [
    { label: "Activos", value: data?.activos ?? 0, icon: Users },
    { label: "Asistencia hoy", value: `${data?.presentes ?? 0}/${data?.registros ?? 0}`, icon: Clock },
    { label: "Docs por vencer", value: data?.vencimientos ?? 0, icon: AlertTriangle },
    { label: "Vacaciones pendientes", value: data?.vacacionesPendientes ?? 0, icon: Plane },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <k.icon className="h-3 w-3 text-primary" />{k.label}
          </div>
          <div className="mt-1 text-base font-bold font-mono">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

// ============================ EMPLOYEES ============================
function EmployeesTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", employee_code: "", position: "", department: "",
    email: "", phone: "", hire_date: new Date().toISOString().slice(0, 10),
    rfc: "", curp: "", nss: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Employee[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.full_name) throw new Error("Nombre requerido");
      const { error } = await supabase.from("employees").insert({
        organization_id: orgId,
        full_name: form.full_name,
        employee_code: form.employee_code || null,
        position: form.position || null,
        department: form.department || null,
        email: form.email || null,
        phone: form.phone || null,
        hire_date: form.hire_date,
        rfc: form.rfc || null,
        curp: form.curp || null,
        nss: form.nss || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Empleado registrado"); setOpen(false); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Directorio · {employees.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nuevo empleado</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08] overflow-y-auto">
            <SheetHeader><SheetTitle>Nuevo empleado</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Nombre completo</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código</Label>
                  <Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha de ingreso</Label>
                  <Input type="date" value={form.hire_date} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Puesto</Label>
                  <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div>
                  <Label>Departamento</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>RFC</Label>
                  <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} />
                </div>
                <div>
                  <Label>CURP</Label>
                  <Input value={form.curp} onChange={(e) => setForm({ ...form, curp: e.target.value })} />
                </div>
                <div>
                  <Label>NSS</Label>
                  <Input value={form.nss} onChange={(e) => setForm({ ...form, nss: e.target.value })} />
                </div>
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin empleados registrados.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {employees.map((e) => (
            <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
              <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-mono text-xs font-bold text-primary">
                {e.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{e.full_name}</span>
                  {e.employee_code && <span className="text-[9px] font-mono text-muted-foreground">#{e.employee_code}</span>}
                  <span className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border ${
                    e.status === "activo" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" :
                    e.status === "baja" ? "bg-rose-500/15 text-rose-300 border-rose-400/30" :
                    "bg-slate-500/15 text-slate-300 border-slate-400/30"
                  }`}>{e.status}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {e.position ?? "—"}{e.department && ` · ${e.department}`}
                  {e.hire_date && ` · ingreso ${new Date(e.hire_date).toLocaleDateString("es-MX")}`}
                </div>
              </div>
              <div className="text-right text-[10px] font-mono text-muted-foreground">
                {e.email && <div>{e.email}</div>}
                {e.phone && <div>{e.phone}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================ ATTENDANCE ============================
function AttendanceTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { data: attendance = [] } = useQuery({
    queryKey: ["hr", "attendance", orgId, date],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*").eq("date", date).order("check_in", { ascending: false });
      return (data ?? []) as Attendance[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees-lite", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("employees").select("id, full_name, employee_code").eq("status", "activo");
      return (data ?? []) as Pick<Employee, "id" | "full_name" | "employee_code">[];
    },
  });
  const empMap = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);

  const { data: projects = [] } = useQuery({
    queryKey: ["hr", "projects-lite"],
    queryFn: async () => (await supabase.from("projects").select("id, name, code")).data ?? [],
  });

  const [form, setForm] = useState({
    employee_id: "", project_id: "", status: "presente" as Attendance["status"],
    check_in: "07:00", check_out: "17:00", hours: "10", notes: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.employee_id) throw new Error("Empleado requerido");
      const ci = form.check_in ? new Date(`${date}T${form.check_in}:00`).toISOString() : null;
      const co = form.check_out ? new Date(`${date}T${form.check_out}:00`).toISOString() : null;
      const { error } = await supabase.from("attendance").upsert({
        organization_id: orgId,
        employee_id: form.employee_id,
        project_id: form.project_id || null,
        date,
        check_in: ci,
        check_out: co,
        hours: Number(form.hours) || 0,
        status: form.status,
        notes: form.notes || null,
      }, { onConflict: "employee_id,date" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Asistencia registrada"); setOpen(false); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-primary" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Registrar asistencia</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
            <SheetHeader><SheetTitle>Registrar asistencia · {new Date(date).toLocaleDateString("es-MX")}</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Empleado</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ATT_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Entrada</Label>
                  <Input type="time" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
                </div>
                <div>
                  <Label>Salida</Label>
                  <Input type="time" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
                </div>
                <div>
                  <Label>Horas</Label>
                  <Input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Proyecto (opcional)</Label>
                <Select value={form.project_id || "none"} onValueChange={(v) => setForm({ ...form, project_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sin proyecto —</SelectItem>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        {attendance.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-12">
            Sin registros para {new Date(date).toLocaleDateString("es-MX")}.
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {attendance.map((a) => {
              const emp = empMap[a.employee_id];
              const status = ATT_STATUS.find((s) => s.id === a.status);
              return (
                <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                  <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-mono font-bold text-primary">
                    {emp?.full_name.split(" ").slice(0, 2).map((n) => n[0]).join("") ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{emp?.full_name ?? "Empleado"}</span>
                      {status && (
                        <span className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border ${status.color}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {a.check_in && new Date(a.check_in).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                      {a.check_out && ` → ${new Date(a.check_out).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
                      {` · ${Number(a.hours).toFixed(1)}h`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================ ASSIGNMENTS ============================
function AssignmentsTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: assignments = [] } = useQuery({
    queryKey: ["hr", "assignments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("employee_assignments").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Assignment[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees-active"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name, position").eq("status", "activo")).data ?? [],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["hr", "projects-active"],
    queryFn: async () => (await supabase.from("projects").select("id, name, code, status")).data ?? [],
  });

  const empMap = useMemo(() => Object.fromEntries(employees.map((e: any) => [e.id, e])), [employees]);
  const projMap = useMemo(() => Object.fromEntries(projects.map((p: any) => [p.id, p])), [projects]);

  const [form, setForm] = useState({
    employee_id: "", project_id: "", role_label: "",
    start_date: new Date().toISOString().slice(0, 10), end_date: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.employee_id || !form.project_id) throw new Error("Empleado y proyecto requeridos");
      const { error } = await supabase.from("employee_assignments").insert({
        organization_id: orgId,
        employee_id: form.employee_id,
        project_id: form.project_id,
        role_label: form.role_label || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        active: true,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Asignación creada"); setOpen(false); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Asignaciones · {assignments.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nueva asignación</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
            <SheetHeader><SheetTitle>Asignar empleado a proyecto</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Empleado</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proyecto</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona proyecto" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rol en el proyecto</Label>
                <Input value={form.role_label} onChange={(e) => setForm({ ...form, role_label: e.target.value })} placeholder="Ej. Soldador, Supervisor" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Fin (opcional)</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin asignaciones registradas.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {assignments.map((a) => {
            const emp = empMap[a.employee_id];
            const proj = projMap[a.project_id];
            return (
              <div key={a.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <div className="h-9 w-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{emp?.full_name ?? "Empleado"}</span>
                    <span className="text-muted-foreground/40">→</span>
                    <span className="text-sm text-primary">{proj?.code ? `${proj.code} · ` : ""}{proj?.name ?? "Proyecto"}</span>
                    {a.active && (
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-300 border-emerald-400/30">Activo</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {a.role_label ?? "Sin rol"}
                    {a.start_date && ` · desde ${new Date(a.start_date).toLocaleDateString("es-MX")}`}
                    {a.end_date && ` → ${new Date(a.end_date).toLocaleDateString("es-MX")}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================ DOCUMENTS ============================
function DocumentsTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["hr", "docs", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("employee_documents").select("*").order("created_at", { ascending: false });
      return (data ?? []) as EmpDoc[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees-for-docs"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name")).data ?? [],
  });
  const empMap = useMemo(() => Object.fromEntries(employees.map((e: any) => [e.id, e])), [employees]);

  const [form, setForm] = useState({
    employee_id: "", kind: "ine" as EmpDoc["kind"], name: "",
    file: null as File | null, expires_at: "", notes: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.employee_id || !form.name) throw new Error("Empleado y nombre requeridos");
      let file_path: string | null = null;
      let file_url: string | null = null;
      if (form.file) {
        const path = `${orgId}/${form.employee_id}/${Date.now()}-${form.file.name}`;
        const { error: upErr } = await supabase.storage.from("employee-docs").upload(path, form.file);
        if (upErr) throw upErr;
        file_path = path;
        const { data: signed } = await supabase.storage.from("employee-docs").createSignedUrl(path, 60 * 60 * 24 * 365);
        file_url = signed?.signedUrl ?? null;
      }
      const { error } = await supabase.from("employee_documents").insert({
        organization_id: orgId,
        employee_id: form.employee_id,
        kind: form.kind,
        name: form.name,
        file_path,
        file_url,
        expires_at: form.expires_at || null,
        notes: form.notes || null,
        uploaded_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Documento guardado"); setOpen(false); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Expedientes · {docs.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Subir documento</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
            <SheetHeader><SheetTitle>Nuevo documento</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Empleado</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOC_KINDS.map((k) => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vence</Label>
                  <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Nombre del documento</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. INE vigente" />
              </div>
              <div>
                <Label>Archivo</Label>
                <Input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })} />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin documentos cargados.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {docs.map((d) => {
            const emp = empMap[d.employee_id];
            const kind = DOC_KINDS.find((k) => k.id === d.kind);
            const expSoon = d.expires_at && new Date(d.expires_at).getTime() < Date.now() + 30 * 86400000;
            const expired = d.expires_at && new Date(d.expires_at) < new Date();
            return (
              <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <div className="h-9 w-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{kind?.label ?? d.kind}</span>
                    <span className="text-sm font-medium truncate">{d.name}</span>
                    {expired ? (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border bg-rose-500/15 text-rose-300 border-rose-400/30">Vencido</span>
                    ) : expSoon ? (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-300 border-amber-400/30">Por vencer</span>
                    ) : null}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {emp?.full_name ?? "—"}
                    {d.expires_at && ` · vence ${new Date(d.expires_at).toLocaleDateString("es-MX")}`}
                  </div>
                </div>
                {d.file_url && (
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary hover:text-primary/80">
                    Abrir
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================ VACATIONS ============================
function VacationsTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  const { data: vacations = [] } = useQuery({
    queryKey: ["hr", "vacations", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("vacation_requests").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Vacation[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["hr", "employees-for-vacation"],
    queryFn: async () => (await supabase.from("employees").select("id, full_name")).data ?? [],
  });
  const empMap = useMemo(() => Object.fromEntries(employees.map((e: any) => [e.id, e])), [employees]);

  const [form, setForm] = useState({
    employee_id: "", start_date: "", end_date: "", reason: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.employee_id || !form.start_date || !form.end_date) throw new Error("Empleado y fechas requeridas");
      const days = Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1);
      const { error } = await supabase.from("vacation_requests").insert({
        organization_id: orgId,
        employee_id: form.employee_id,
        start_date: form.start_date,
        end_date: form.end_date,
        days,
        reason: form.reason || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Solicitud registrada"); setOpen(false); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Vacation["status"] }) => {
      const { error } = await supabase.from("vacation_requests").update({
        status,
        approved_by: status === "aprobada" ? profile?.id : null,
        approved_at: status === "aprobada" ? new Date().toISOString() : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Actualizado"); qc.invalidateQueries({ queryKey: ["hr"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Solicitudes · {vacations.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nueva solicitud</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
            <SheetHeader><SheetTitle>Solicitud de vacaciones</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Empleado</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona empleado" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {vacations.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin solicitudes registradas.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {vacations.map((v) => {
            const emp = empMap[v.employee_id];
            const status = VAC_STATUS.find((s) => s.id === v.status);
            return (
              <div key={v.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <div className="h-9 w-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Plane className="h-4 w-4 text-violet-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{emp?.full_name ?? "Empleado"}</span>
                    {status && (
                      <span className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-muted-foreground">{v.days} días</span>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {new Date(v.start_date).toLocaleDateString("es-MX")} → {new Date(v.end_date).toLocaleDateString("es-MX")}
                    {v.reason && ` · ${v.reason}`}
                  </div>
                </div>
                {v.status === "solicitada" && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-emerald-300 hover:text-emerald-200" onClick={() => updateStatus.mutate({ id: v.id, status: "aprobada" })}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-rose-300 hover:text-rose-200" onClick={() => updateStatus.mutate({ id: v.id, status: "rechazada" })}>
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
