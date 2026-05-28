import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Clock, MessageSquare, Plus, ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authenticated/nexus/approvals")({
  component: ApprovalsPage,
});

type Approval = {
  id: string;
  kind: "compra" | "permiso" | "inspeccion" | "vacacion" | "gasto" | "otro";
  entity_table: string;
  entity_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: "pendiente" | "aprobado" | "rechazado" | "observado";
  decision_notes: string | null;
  project_id: string | null;
  created_at: string;
};

const KIND_LABEL: Record<Approval["kind"], string> = {
  compra: "Compra", permiso: "Permiso", inspeccion: "Inspección",
  vacacion: "Vacaciones", gasto: "Gasto", otro: "Otro",
};

const STATUS_META: Record<Approval["status"], { label: string; color: string }> = {
  pendiente:  { label: "Pendiente", color: "border-amber-500/30 text-amber-300 bg-amber-500/[0.06]" },
  aprobado:   { label: "Aprobado",  color: "border-emerald-500/30 text-emerald-300 bg-emerald-500/[0.06]" },
  rechazado:  { label: "Rechazado", color: "border-red-500/30 text-red-300 bg-red-500/[0.06]" },
  observado:  { label: "Observado", color: "border-blue-500/30 text-blue-300 bg-blue-500/[0.06]" },
};

function ApprovalsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<Approval["status"] | "all">("pendiente");
  const [showNew, setShowNew] = useState(false);
  const [newKind, setNewKind] = useState<Approval["kind"]>("compra");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState<string>("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["approvals", statusFilter],
    refetchInterval: 25_000,
    queryFn: async () => {
      let q = supabase.from("approvals").select("*").order("created_at", { ascending: false }).limit(300);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Approval[];
    },
  });

  const counts = useMemo(() => {
    const c = { pendiente: 0, aprobado: 0, rechazado: 0, observado: 0 };
    items.forEach((i) => { c[i.status]++; });
    return c;
  }, [items]);

  async function decide(id: string, status: Approval["status"], notes?: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("approvals").update({
      status,
      decision_notes: notes ?? null,
      decided_by: userId,
      decided_at: new Date().toISOString(),
    }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["approvals"] });
  }

  async function createApproval() {
    if (!newTitle.trim()) return;
    const { data: prof } = await supabase.from("profiles").select("organization_id").maybeSingle();
    if (!prof?.organization_id) return;
    const userId = (await supabase.auth.getUser()).data.user?.id;
    await supabase.from("approvals").insert({
      organization_id: prof.organization_id,
      kind: newKind,
      entity_table: "manual",
      entity_id: crypto.randomUUID(),
      title: newTitle,
      description: newDesc || null,
      amount: newAmount ? Number(newAmount) : null,
      requested_by: userId,
    });
    setNewTitle(""); setNewDesc(""); setNewAmount(""); setShowNew(false);
    qc.invalidateQueries({ queryKey: ["approvals"] });
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.35em] uppercase text-muted-foreground mb-1">
            NEXUS · WORKFLOW · APPROVALS
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Aprobaciones operativas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Flujos de autorización para compras, permisos, inspecciones, gastos y vacaciones.
          </p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary/15 border border-primary/30 text-primary text-[10px] font-mono tracking-[0.25em] uppercase hover:bg-primary/20"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva
        </button>
      </div>

      {showNew && (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select value={newKind} onChange={(e) => setNewKind(e.target.value as Approval["kind"])}
              className="bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-xs">
              {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título de la solicitud"
              className="bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-xs md:col-span-2" />
            <input value={newAmount} onChange={(e) => setNewAmount(e.target.value)} type="number" placeholder="Monto (opcional)"
              className="bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-xs" />
          </div>
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Justificación..." rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2 text-xs" />
          <div className="flex justify-end">
            <button onClick={createApproval} className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-[10px] font-mono tracking-[0.2em] uppercase">
              Enviar a aprobación
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(STATUS_META) as Approval["status"][]).map((s) => (
          <div key={s} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1">{STATUS_META[s].label}</div>
            <div className="text-2xl font-semibold">{counts[s]}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
        {(["pendiente", "aprobado", "rechazado", "observado", "all"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.2em] uppercase border transition ${
              statusFilter === s ? "bg-primary/15 text-primary border-primary/40"
                : "bg-white/[0.02] text-muted-foreground border-white/[0.06] hover:text-foreground"
            }`}>
            {s === "all" ? "Todas" : s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <div className="text-xs font-mono text-muted-foreground">Cargando…</div>}
        {!isLoading && items.length === 0 && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">
            Sin solicitudes en este filtro.
          </div>
        )}
        {items.map((a) => (
          <div key={a.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-muted-foreground">{KIND_LABEL[a.kind]}</span>
                  <span className={`text-[9px] font-mono tracking-[0.25em] uppercase px-2 py-0.5 rounded-full border ${STATUS_META[a.status].color}`}>
                    {STATUS_META[a.status].label}
                  </span>
                  {a.amount != null && (
                    <span className="text-[10px] font-mono text-foreground/80">
                      ${Number(a.amount).toLocaleString()}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />{new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm font-medium">{a.title}</div>
                {a.description && <div className="text-xs text-muted-foreground mt-1">{a.description}</div>}
                {a.decision_notes && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
                    <MessageSquare className="h-3 w-3 mt-0.5" /> {a.decision_notes}
                  </div>
                )}
                {a.status === "pendiente" && (
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => decide(a.id, "aprobado")}
                      className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" /> Aprobar
                    </button>
                    <button onClick={() => {
                      const n = window.prompt("Motivo del rechazo:");
                      if (n != null) decide(a.id, "rechazado", n);
                    }}
                      className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-red-500/30 text-red-200 hover:bg-red-500/10">
                      <XCircle className="h-3 w-3 inline mr-1" /> Rechazar
                    </button>
                    <button onClick={() => {
                      const n = window.prompt("Observación:");
                      if (n != null) decide(a.id, "observado", n);
                    }}
                      className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-md border border-blue-500/30 text-blue-200 hover:bg-blue-500/10">
                      Observar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
