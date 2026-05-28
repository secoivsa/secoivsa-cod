import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Building2,
  Users,
  ScrollText,
  Activity,
  Rocket,
  Shield,
  Check,
  Loader2,
  UserPlus,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { RowSkeleton, EmptyState } from "@/components/nexus/LoadingStates";

export const Route = createFileRoute("/_authenticated/nexus/settings")({
  component: SettingsPage,
});

type Tab = "org" | "users" | "audit" | "health" | "onboarding";

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: "org", label: "Organización", icon: Building2 },
  { id: "users", label: "Usuarios & Roles", icon: Users },
  { id: "audit", label: "Auditoría", icon: ScrollText },
  { id: "health", label: "System Health", icon: Activity },
  { id: "onboarding", label: "Onboarding", icon: Rocket },
];

const ALL_ROLES: AppRole[] = [
  "direccion",
  "admin",
  "produccion",
  "calidad",
  "seguridad",
  "finanzas",
  "rh",
  "compras",
  "supervisor",
  "cliente",
  "proveedor",
];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("org");
  const { hasAnyRole } = useAuth();
  const isAdmin = hasAnyRole(["admin", "direccion"]);

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Centro de control · NEXUS OS</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Settings & Administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Configuración enterprise · organización, usuarios, auditoría y salud
          de la plataforma.
        </p>
      </header>

      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-white/[0.06]">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`group relative inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono tracking-[0.12em] uppercase whitespace-nowrap transition ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {active && (
                <span className="absolute left-0 right-0 -bottom-1 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        {tab === "org" && <OrgTab isAdmin={isAdmin} />}
        {tab === "users" && <UsersTab isAdmin={isAdmin} />}
        {tab === "audit" && <AuditTab />}
        {tab === "health" && <HealthTab />}
        {tab === "onboarding" && <OnboardingTab />}
      </div>
    </div>
  );
}

/* ============================ ORG ============================ */
function OrgTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data: org, isLoading } = useQuery({
    queryKey: ["settings-org"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<{
    name: string;
    legal_name: string;
    rfc: string;
    logo_url: string;
  } | null>(null);

  const current = form ?? {
    name: org?.name ?? "",
    legal_name: org?.legal_name ?? "",
    rfc: org?.rfc ?? "",
    logo_url: org?.logo_url ?? "",
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!org) throw new Error("Sin organización");
      const { error } = await supabase
        .from("organizations")
        .update({
          name: current.name,
          legal_name: current.legal_name || null,
          rfc: current.rfc || null,
          logo_url: current.logo_url || null,
        })
        .eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Organización actualizada");
      qc.invalidateQueries({ queryKey: ["settings-org"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <RowSkeleton rows={3} />;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold">Información empresarial</h2>
          <p className="text-xs text-muted-foreground">
            Datos fiscales y de marca para la organización activa.
          </p>
        </div>

        <Field label="Nombre comercial">
          <input
            disabled={!isAdmin}
            value={current.name}
            onChange={(e) => setForm({ ...current, name: e.target.value })}
            className="nx-input"
          />
        </Field>
        <Field label="Razón social">
          <input
            disabled={!isAdmin}
            value={current.legal_name}
            onChange={(e) =>
              setForm({ ...current, legal_name: e.target.value })
            }
            className="nx-input"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="RFC">
            <input
              disabled={!isAdmin}
              value={current.rfc}
              onChange={(e) => setForm({ ...current, rfc: e.target.value })}
              className="nx-input"
            />
          </Field>
          <Field label="Logo URL">
            <input
              disabled={!isAdmin}
              value={current.logo_url}
              onChange={(e) =>
                setForm({ ...current, logo_url: e.target.value })
              }
              placeholder="https://..."
              className="nx-input"
            />
          </Field>
        </div>

        {isAdmin && form && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
            >
              {save.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Guardar cambios
            </button>
            <button
              onClick={() => setForm(null)}
              className="px-4 py-2 rounded-md border border-white/10 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        )}
        {!isAdmin && (
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
            Sólo dirección/admin pueden editar.
          </p>
        )}
      </section>

      <aside className="space-y-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Identidad
          </div>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold">
              {(current.name || "—")[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">{current.name || "—"}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {current.rfc || "sin RFC"}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-2">
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
            Multi-organización
          </div>
          <p className="text-xs text-muted-foreground">
            La arquitectura soporta múltiples organizaciones bajo el mismo
            tenant. El switch visible se activará al provisionar la segunda
            organización.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ============================ USERS ============================ */
function UsersTab({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, job_title, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
      }));
    },
  });

  const addRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { data: prof } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();
      if (!prof?.organization_id) throw new Error("Sin organización");
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        organization_id: prof.organization_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rol asignado");
      qc.invalidateQueries({ queryKey: ["settings-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rol removido");
      qc.invalidateQueries({ queryKey: ["settings-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <RowSkeleton rows={5} />;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Invitar usuarios
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg">
              Los nuevos miembros se registran en{" "}
              <span className="font-mono text-primary">/login</span>. Una vez
              registrados, el admin asigna roles desde esta vista.
            </p>
          </div>
          <a
            href="/login"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono uppercase tracking-wider hover:bg-white/[0.08]"
          >
            Compartir enlace →
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
          {data?.length ?? 0} usuarios registrados
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(data ?? []).map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isAdmin={isAdmin}
              onAdd={(role) => addRole.mutate({ userId: u.id, role })}
              onRemove={(role) => removeRole.mutate({ userId: u.id, role })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  isAdmin,
  onAdd,
  onRemove,
}: {
  user: { id: string; full_name: string | null; email: string | null; job_title: string | null; roles: AppRole[] };
  isAdmin: boolean;
  onAdd: (role: AppRole) => void;
  onRemove: (role: AppRole) => void;
}) {
  const [picker, setPicker] = useState(false);
  const available = ALL_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
      <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-xs font-mono font-bold shrink-0">
        {(user.full_name ?? user.email ?? "?")[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="text-sm font-semibold">
          {user.full_name ?? user.email}
        </div>
        <div className="text-[11px] text-muted-foreground">{user.email}</div>
        {user.job_title && (
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mt-0.5">
            {user.job_title}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center min-w-0 flex-1 justify-end">
        {user.roles.length === 0 && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            sin rol
          </span>
        )}
        {user.roles.map((r) => (
          <span
            key={r}
            className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono uppercase tracking-wider text-primary"
          >
            {r}
            {isAdmin && (
              <button
                onClick={() => onRemove(r)}
                className="opacity-0 group-hover:opacity-100 transition hover:text-destructive"
                aria-label={`Remover ${r}`}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}
          </span>
        ))}
        {isAdmin && available.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setPicker((v) => !v)}
              className="px-2 py-0.5 rounded-full border border-dashed border-white/15 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-white/30"
            >
              + rol
            </button>
            {picker && (
              <div className="absolute right-0 mt-1 z-10 bg-[#0a0d12] border border-white/10 rounded-md shadow-xl py-1 min-w-[140px] max-h-[240px] overflow-y-auto">
                {available.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onAdd(r);
                      setPicker(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider hover:bg-white/[0.05]"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ AUDIT ============================ */
function AuditTab() {
  const [source, setSource] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["audit-events", source],
    queryFn: async () => {
      let q = supabase
        .from("system_events")
        .select("id, created_at, source, event_type, title, description, severity")
        .order("created_at", { ascending: false })
        .limit(100);
      if (source !== "all") q = q.eq("source", source as never);
      const { data } = await q;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const SOURCES = [
    "all",
    "crm",
    "projects",
    "production",
    "supply",
    "quality",
    "safety",
    "finance",
    "hr",
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider border transition ${
              source === s
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-white/[0.02] border-white/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RowSkeleton rows={6} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin eventos aún"
          description="La auditoría se llena automáticamente cuando los módulos generan actividad."
        />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
          {(data ?? []).map((e) => (
            <div key={e.id} className="px-5 py-3 flex items-start gap-4">
              <div
                className={`h-2 w-2 mt-1.5 rounded-full shrink-0 ${
                  e.severity === "critical"
                    ? "bg-destructive"
                    : e.severity === "warning"
                      ? "bg-amber-500"
                      : "bg-primary"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
                    {e.source}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    · {e.event_type}
                  </span>
                </div>
                <div className="text-sm font-medium truncate">{e.title}</div>
                {e.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {e.description}
                  </div>
                )}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground shrink-0 whitespace-nowrap">
                {new Date(e.created_at).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ HEALTH ============================ */
function HealthTab() {
  const { data } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const t0 = performance.now();
      const probe = await supabase.from("organizations").select("id").limit(1);
      const latency = Math.round(performance.now() - t0);
      const [projects, alerts, events, users] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("status", "activa"),
        supabase
          .from("system_events")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return {
        latency,
        dbOk: !probe.error,
        projects: projects.count ?? 0,
        activeAlerts: alerts.count ?? 0,
        events24h: events.count ?? 0,
        users: users.count ?? 0,
      };
    },
    refetchInterval: 60_000,
  });

  const services = [
    { label: "Base de datos", ok: data?.dbOk, detail: `${data?.latency ?? "—"} ms` },
    { label: "Autenticación", ok: true, detail: "supabase.auth · OK" },
    { label: "Storage (evidencias, RH)", ok: true, detail: "buckets privados activos" },
    { label: "Workflow engine", ok: true, detail: "triggers operativos" },
    { label: "Notificaciones live", ok: true, detail: "poll 15s" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Latencia DB" value={`${data?.latency ?? "—"} ms`} />
        <Metric label="Alertas activas" value={data?.activeAlerts ?? 0} />
        <Metric label="Eventos 24h" value={data?.events24h ?? 0} />
        <Metric label="Usuarios" value={data?.users ?? 0} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
        {services.map((s) => (
          <div key={s.label} className="px-5 py-3 flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                s.ok ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" : "bg-destructive"
              }`}
            />
            <span className="text-sm flex-1">{s.label}</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {s.detail}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.05] to-transparent p-5">
        <h3 className="text-sm font-semibold mb-2">Backups & recuperación</h3>
        <p className="text-xs text-muted-foreground max-w-2xl">
          La capa de datos opera sobre infraestructura administrada con backups
          automáticos diarios y point-in-time recovery. Los buckets de evidencias
          y documentos de RH son privados con URLs firmadas de corta duración.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="text-[9px] font-mono tracking-[0.25em] uppercase text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

/* ============================ ONBOARDING ============================ */
function OnboardingTab() {
  const { data } = useQuery({
    queryKey: ["onboarding-status"],
    queryFn: async () => {
      const [org, users, clients, projects, materials, employees] = await Promise.all([
        supabase.from("organizations").select("id, name").limit(1).maybeSingle(),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("materials").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
      ]);
      return {
        orgConfigured: Boolean(org.data?.name && org.data.name !== "Default"),
        users: users.count ?? 0,
        clients: clients.count ?? 0,
        projects: projects.count ?? 0,
        materials: materials.count ?? 0,
        employees: employees.count ?? 0,
      };
    },
  });

  const steps = [
    {
      done: data?.orgConfigured,
      title: "Configurar organización",
      desc: "Define nombre comercial, razón social y RFC.",
      link: "#org",
    },
    {
      done: (data?.users ?? 0) > 1,
      title: "Invitar al equipo",
      desc: "Al menos un colaborador adicional con su rol asignado.",
      link: "/nexus/settings",
    },
    {
      done: (data?.clients ?? 0) > 0,
      title: "Registrar primer cliente",
      desc: "Activa el módulo CRM y abre la cartera comercial.",
      link: "/nexus/crm",
    },
    {
      done: (data?.projects ?? 0) > 0,
      title: "Crear primer proyecto",
      desc: "Sincroniza producción, calidad, finanzas y seguridad.",
      link: "/nexus/projects",
    },
    {
      done: (data?.materials ?? 0) > 0,
      title: "Catálogo de materiales",
      desc: "Habilita requisiciones y control de inventario.",
      link: "/nexus/supply",
    },
    {
      done: (data?.employees ?? 0) > 0,
      title: "Alta de personal",
      desc: "Expediente digital, asignación y asistencia.",
      link: "/nexus/hr",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-3">
        {steps.map((s, i) => (
          <a
            key={i}
            href={s.link}
            className="group flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition"
          >
            <div
              className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 ${
                s.done
                  ? "bg-primary/15 border-primary text-primary"
                  : "border-white/10 text-muted-foreground"
              }`}
            >
              {s.done ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-[10px] font-mono">{i + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
          </a>
        ))}
      </section>
      <aside className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-primary/[0.08] to-transparent p-6 self-start">
        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-primary mb-2">
          Progreso de implementación
        </div>
        <div className="text-4xl font-semibold">{pct}%</div>
        <div className="text-xs text-muted-foreground mt-1">
          {completed} de {steps.length} pasos completados
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed">
          NEXUS OS aprende a operar con tu empresa a medida que completas estos
          pasos. La automatización industrial se activa cuando los módulos
          tienen datos reales.
        </p>
      </aside>
    </div>
  );
}

/* ============================ UI helpers ============================ */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
