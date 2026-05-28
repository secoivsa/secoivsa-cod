import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Inbox, Filter, Users2, Send, Sparkles, Tag, ArrowRight,
  CheckCircle2, Clock, AlertCircle, Hash, Loader2, Building2,
} from "lucide-react";
import {
  classifyEmail, extractTags, DEPARTMENT_LABELS, DEPARTMENT_TONE,
  type Department, type RoutingRule,
} from "@/lib/mail/routing-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nexus/mail-hub")({
  component: MailHubPage,
});

const CENTRAL_EMAIL = "contacto@secoivsa.com";

type EmailRow = {
  id: string;
  subject: string;
  from_email: string;
  from_name: string | null;
  body_text: string | null;
  tags: string[] | null;
  detected_department: Department | null;
  assigned_department: Department | null;
  routing_confidence: number | null;
  status: string;
  project_id: string | null;
  received_at: string;
};

function MailHubPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"inbox" | "compose" | "rules" | "departments">("inbox");
  const [filterDept, setFilterDept] = useState<Department | "all">("all");

  const emails = useQuery({
    queryKey: ["mail-hub", "emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_messages")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as EmailRow[];
    },
  });

  const rules = useQuery({
    queryKey: ["mail-hub", "rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_routing_rules")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return (data ?? []) as RoutingRule[];
    },
  });

  const depts = useQuery({
    queryKey: ["mail-hub", "depts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_members")
        .select("id, user_id, department, is_lead");
      if (error) throw error;
      return data ?? [];
    },
  });

  const stats = useMemo(() => {
    const list = emails.data ?? [];
    const byDept = new Map<Department, number>();
    for (const e of list) {
      const d = (e.detected_department || "general") as Department;
      byDept.set(d, (byDept.get(d) ?? 0) + 1);
    }
    return {
      total: list.length,
      nuevos: list.filter((e) => e.status === "nuevo").length,
      asignados: list.filter((e) => e.status === "asignado" || e.status === "en_proceso").length,
      cerrados: list.filter((e) => e.status === "cerrado" || e.status === "respondido").length,
      byDept,
    };
  }, [emails.data]);

  const filtered = useMemo(() => {
    const list = emails.data ?? [];
    if (filterDept === "all") return list;
    return list.filter((e) => (e.detected_department || "general") === filterDept);
  }, [emails.data, filterDept]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">
            <Mail className="h-3 w-3" /> Central Mail Hub
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Centro operativo de comunicación</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inbox unificado · Routing inteligente · Threading por proyecto
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-[11px] text-primary">{CENTRAL_EMAIL}</span>
          <span className="text-[10px] text-muted-foreground">· remitente único</span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Inbox} label="Mensajes" value={stats.total} tone="text-foreground" />
        <Stat icon={AlertCircle} label="Nuevos" value={stats.nuevos} tone="text-amber-300" />
        <Stat icon={Clock} label="En proceso" value={stats.asignados} tone="text-sky-300" />
        <Stat icon={CheckCircle2} label="Cerrados" value={stats.cerrados} tone="text-emerald-300" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-white/[0.06]">
        {[
          { id: "inbox", label: "Inbox", icon: Inbox },
          { id: "compose", label: "Simular entrada", icon: Sparkles },
          { id: "rules", label: "Reglas de routing", icon: Filter },
          { id: "departments", label: "Departamentos", icon: Users2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-xs font-mono tracking-[0.15em] uppercase flex items-center gap-2 border-b-2 transition ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "inbox" && (
        <InboxTab
          emails={filtered}
          loading={emails.isLoading}
          stats={stats.byDept}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          onChange={() => qc.invalidateQueries({ queryKey: ["mail-hub"] })}
        />
      )}
      {tab === "compose" && (
        <ComposeTab
          rules={rules.data ?? []}
          onSent={() => qc.invalidateQueries({ queryKey: ["mail-hub"] })}
        />
      )}
      {tab === "rules" && <RulesTab rules={rules.data ?? []} loading={rules.isLoading} />}
      {tab === "departments" && (
        <DepartmentsTab depts={depts.data ?? []} byDept={stats.byDept} />
      )}
    </div>
  );
}

/* ============== INBOX ============== */
function InboxTab({
  emails, loading, stats, filterDept, setFilterDept, onChange,
}: {
  emails: EmailRow[];
  loading: boolean;
  stats: Map<Department, number>;
  filterDept: Department | "all";
  setFilterDept: (d: Department | "all") => void;
  onChange: () => void;
}) {
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const depts = Object.keys(DEPARTMENT_LABELS) as Department[];

  const assign = useMutation({
    mutationFn: async ({ id, dept, status }: { id: string; dept?: Department; status?: string }) => {
      const patch: { assigned_department?: Department; status?: "nuevo" | "asignado" | "en_proceso" | "respondido" | "cerrado" | "archivado" } = {};
      if (dept) patch.assigned_department = dept;
      if (status) patch.status = status as typeof patch.status;
      const { error } = await supabase.from("email_messages").update(patch).eq("id", id);
      if (error) throw error;
      await supabase.from("email_events").insert({
        email_id: id,
        event_type: dept ? "assigned" : "status_changed",
        metadata: { ...patch } as never,
      });
    },
    onSuccess: () => { toast.success("Actualizado"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid lg:grid-cols-[280px_1fr_360px] gap-4">
      {/* Department filter */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground px-2 mb-2">
          Departamentos
        </div>
        <button
          onClick={() => setFilterDept("all")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
            filterDept === "all" ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.03]"
          }`}
        >
          <span className="flex items-center gap-2"><Inbox className="h-3.5 w-3.5" /> Todos</span>
          <span className="font-mono text-[10px]">{emails.length}</span>
        </button>
        {depts.map((d) => (
          <button
            key={d}
            onClick={() => setFilterDept(d)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition ${
              filterDept === d ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/[0.03]"
            }`}
          >
            <span className="text-left truncate">{DEPARTMENT_LABELS[d]}</span>
            <span className="font-mono text-[10px]">{stats.get(d) ?? 0}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0d12] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando inbox…
          </div>
        ) : emails.length === 0 ? (
          <EmptyInbox />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {emails.map((e) => {
              const dept = (e.detected_department || "general") as Department;
              const isSel = selected?.id === e.id;
              return (
                <li
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={`px-4 py-3 cursor-pointer transition ${isSel ? "bg-primary/[0.08]" : "hover:bg-white/[0.02]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold truncate">{e.from_name || e.from_email}</span>
                        <span className="text-muted-foreground/60 truncate">{e.from_email}</span>
                      </div>
                      <div className="mt-1 text-sm font-medium truncate">{e.subject}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">{e.body_text?.slice(0, 110)}</div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono tracking-wider uppercase ${DEPARTMENT_TONE[dept]}`}>
                          {DEPARTMENT_LABELS[dept]}
                        </span>
                        {(e.tags ?? []).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded border border-white/10 text-[10px] font-mono text-muted-foreground">
                            {t}
                          </span>
                        ))}
                        <StatusPill status={e.status} />
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {new Date(e.received_at).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Detail */}
      <div className="rounded-lg border border-white/[0.06] bg-[#0a0d12] p-4 h-fit">
        {!selected ? (
          <div className="text-sm text-muted-foreground text-center py-12">
            Selecciona un mensaje para ver el routing y acciones.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">Mensaje</div>
              <h3 className="mt-1 text-sm font-bold leading-tight">{selected.subject}</h3>
              <div className="mt-2 text-xs text-muted-foreground">
                De: <span className="text-foreground">{selected.from_name || selected.from_email}</span>
              </div>
              <div className="text-xs text-muted-foreground">Para: {CENTRAL_EMAIL}</div>
            </div>
            <div className="rounded-md bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
              {selected.body_text || "(sin cuerpo)"}
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-2">Routing</div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded border text-[10px] font-mono uppercase ${DEPARTMENT_TONE[(selected.detected_department || "general") as Department]}`}>
                  {DEPARTMENT_LABELS[(selected.detected_department || "general") as Department]}
                </span>
                <span className="text-muted-foreground">
                  conf. {Math.round((selected.routing_confidence ?? 0) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-2">Reasignar departamento</div>
              <select
                value={selected.assigned_department || selected.detected_department || "general"}
                onChange={(e) => assign.mutate({ id: selected.id, dept: e.target.value as Department })}
                className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm"
              >
                {depts.map((d) => (
                  <option key={d} value={d}>{DEPARTMENT_LABELS[d]}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] font-mono tracking-[0.25em] uppercase text-muted-foreground mb-2">Estado</div>
              <div className="grid grid-cols-3 gap-1.5">
                {["nuevo", "asignado", "en_proceso", "respondido", "cerrado", "archivado"].map((s) => (
                  <button
                    key={s}
                    onClick={() => assign.mutate({ id: selected.id, status: s })}
                    className={`px-2 py-1.5 rounded text-[10px] font-mono uppercase border transition ${
                      selected.status === s
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-white/10 text-muted-foreground hover:bg-white/[0.04]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== COMPOSE / SIMULATE ============== */
function ComposeTab({ rules, onSent }: { rules: RoutingRule[]; onSent: () => void }) {
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const preview = useMemo(() => {
    if (!subject && !body) return null;
    return classifyEmail({ subject, body, from_email: from || "unknown@example.com" }, rules);
  }, [subject, body, from, rules]);

  const submit = useMutation({
    mutationFn: async () => {
      const result = classifyEmail({ subject, body, from_email: from }, rules);
      const tags = extractTags(subject);
      const { data, error } = await supabase
        .from("email_messages")
        .insert({
          from_email: from,
          subject,
          body_text: body,
          tags,
          detected_department: result.department,
          detected_keywords: result.matched_keywords,
          routing_confidence: result.confidence,
          routing_rule_id: result.matched_rule_id,
          assigned_department: result.department,
          status: "nuevo",
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("email_events").insert([
        { email_id: data.id, event_type: "received", metadata: { from, subject } },
        { email_id: data.id, event_type: "routed", metadata: { department: result.department, rule: result.matched_rule_name, confidence: result.confidence } },
      ]);
    },
    onSuccess: () => {
      toast.success("Email simulado · routing aplicado");
      setSubject(""); setBody(""); setFrom("");
      onSent();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground">Simular email entrante</div>
        <p className="text-xs text-muted-foreground">
          Mientras el bridge de correo real no está conectado, puedes inyectar mensajes de prueba que pasan por el motor de routing.
        </p>
        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="remitente@cliente.com"
          className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Asunto · usa [RH] [COTIZACION] [COMPRA] [PRODUCCION] [CALIDAD] [SEGURIDAD] [FINANZAS]…"
          className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Cuerpo del mensaje…"
          rows={8}
          className="w-full bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm font-mono"
        />
        <button
          disabled={!from || !subject || submit.isPending}
          onClick={() => submit.mutate()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Inyectar al inbox
        </button>
      </div>

      <div className="rounded-lg border border-white/[0.06] bg-[#0a0d12] p-4">
        <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-3">Vista previa de routing</div>
        {!preview ? (
          <div className="text-sm text-muted-foreground py-12 text-center">
            Escribe un asunto para ver la clasificación en vivo.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Departamento detectado:</span>
              <span className={`px-2 py-1 rounded border text-[10px] font-mono uppercase ${DEPARTMENT_TONE[preview.department]}`}>
                {DEPARTMENT_LABELS[preview.department]}
              </span>
            </div>
            <Row label="Confianza" value={`${Math.round(preview.confidence * 100)}%`} />
            <Row label="Regla" value={preview.matched_rule_name || "(ninguna · fallback general)"} />
            <Row label="Tags" value={preview.tag_hits.join(" ") || "—"} />
            <Row label="Palabras clave" value={preview.matched_keywords.join(", ") || "—"} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-white/[0.06]">
              <Hash className="h-3 w-3" /> El email se asignará automáticamente al departamento detectado.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== RULES ============== */
function RulesTab({ rules, loading }: { rules: RoutingRule[]; loading: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0a0d12] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Reglas de routing</div>
          <div className="text-[11px] text-muted-foreground">
            Ordenadas por prioridad · menor número = mayor prioridad
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">{rules.length} reglas</span>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-left px-4 py-2">Patrón</th>
              <th className="text-left px-4 py-2">→ Departamento</th>
              <th className="text-right px-4 py-2">Prio</th>
              <th className="text-right px-4 py-2">Activa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rules.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono uppercase text-muted-foreground">
                    {r.match_type}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-foreground/80">{r.pattern}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase ${DEPARTMENT_TONE[r.target_department]}`}>
                      {DEPARTMENT_LABELS[r.target_department]}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">{r.priority}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`inline-block h-2 w-2 rounded-full ${r.active ? "bg-emerald-400" : "bg-white/20"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ============== DEPARTMENTS ============== */
function DepartmentsTab({
  depts, byDept,
}: { depts: Array<{ id: string; user_id: string; department: string; is_lead: boolean }>; byDept: Map<Department, number> }) {
  const depList = Object.keys(DEPARTMENT_LABELS) as Department[];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {depList.map((d) => {
        const members = depts.filter((m) => m.department === d);
        return (
          <div key={d} className="rounded-lg border border-white/[0.06] bg-[#0a0d12] p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-mono uppercase ${DEPARTMENT_TONE[d]}`}>
                  {DEPARTMENT_LABELS[d]}
                </span>
                <div className="mt-3 text-2xl font-bold tabular-nums">{byDept.get(d) ?? 0}</div>
                <div className="text-[11px] text-muted-foreground">mensajes recientes</div>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Responsables</div>
              {members.length === 0 ? (
                <div className="text-xs text-muted-foreground/60">Sin asignación — configurable desde admin.</div>
              ) : (
                <div className="text-xs text-foreground/80">{members.length} miembro(s) · {members.filter((m) => m.is_lead).length} lead</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============== HELPERS ============== */
function Stat({ icon: Icon, label, value, tone }: { icon: typeof Mail; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-[#0a0d12] p-4">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground/90 font-mono break-all">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "nuevo" ? "text-amber-300 border-amber-400/30" :
    status === "asignado" || status === "en_proceso" ? "text-sky-300 border-sky-400/30" :
    status === "respondido" || status === "cerrado" ? "text-emerald-300 border-emerald-400/30" :
    "text-muted-foreground border-white/10";
  return (
    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono uppercase ${tone}`}>{status}</span>
  );
}

function EmptyInbox() {
  return (
    <div className="px-6 py-16 text-center">
      <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto" />
      <h3 className="mt-4 text-sm font-semibold">Inbox vacío</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
        Cuando se conecte el bridge real de <span className="font-mono">contacto@secoivsa.com</span>, los mensajes llegarán aquí.
        Mientras tanto usa <span className="text-foreground">Simular entrada</span> para probar el routing engine.
      </p>
    </div>
  );
}
