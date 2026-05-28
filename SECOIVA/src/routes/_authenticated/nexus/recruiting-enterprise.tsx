import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listInterviews, scheduleInterview, updateInterviewStatus,
  listBlacklist, addToBlacklist, removeFromBlacklist,
  listAuditLogs, getHRMetrics, exportCandidatesCSV,
  recomputeAllRisk, uploadCandidateDocument, revalidateDocument,
} from "@/lib/recruiting-enterprise.functions";
import { listCandidates } from "@/lib/recruiting.functions";
import jsPDF from "jspdf";
import {
  Calendar, ShieldAlert, FileText, BarChart3, Download, Plus, Loader2,
  CheckCircle2, XCircle, RefreshCw, Upload, ScrollText,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nexus/recruiting-enterprise")({
  component: RecruitingEnterprisePage,
});

type Tab = "metrics" | "calendar" | "documents" | "blacklist" | "audit";

function RecruitingEnterprisePage() {
  const [tab, setTab] = useState<Tab>("metrics");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RH · enterprise console · fase 2
        </p>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">RH Enterprise</h1>
        <p className="text-sm text-muted-foreground">
          Agenda inteligente · OCR · scoring de riesgo · blacklist · auditoría · multiempresa.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-3">
        {([
          ["metrics", BarChart3, "Métricas"],
          ["calendar", Calendar, "Agenda"],
          ["documents", FileText, "Documentos"],
          ["blacklist", ShieldAlert, "Blacklist"],
          ["audit", ScrollText, "Auditoría"],
        ] as const).map(([k, Icon, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-widest border transition inline-flex items-center gap-2 ${tab === k ? "bg-primary/15 border-primary/30 text-primary" : "border-white/10 text-white/55 hover:text-white"}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </nav>

      {tab === "metrics" && <MetricsTab />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "documents" && <DocumentsTab />}
      {tab === "blacklist" && <BlacklistTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────── METRICS
function MetricsTab() {
  const fn = useServerFn(getHRMetrics);
  const expFn = useServerFn(exportCandidatesCSV);
  const riskFn = useServerFn(recomputeAllRisk);
  const { data, isLoading, refetch } = useQuery({ queryKey: ["hr", "metrics"], queryFn: () => fn() });

  const downloadCSV = async () => {
    const r = await expFn();
    const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `candidatos-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportados ${r.count} candidatos`);
  };

  const downloadPDF = async () => {
    if (!data) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("SECOIVSA · Reporte RH", 14, 18);
    doc.setFontSize(9); doc.text(format(new Date(), "PPPp", { locale: es }), 14, 24);
    let y = 36;
    const line = (k: string, v: string) => { doc.text(`${k}: ${v}`, 14, y); y += 7; };
    doc.setFontSize(11);
    line("Total candidatos", String(data.total_candidates));
    line("Contratados", String(data.hired_count));
    line("Tasa de aprobación", `${(data.approval_rate * 100).toFixed(1)}%`);
    line("Tiempo promedio contratación", data.avg_hire_days ? `${data.avg_hire_days.toFixed(1)} días` : "—");
    line("AI score promedio", data.avg_ai_score ? data.avg_ai_score.toFixed(1) : "—");
    line("Entrevistas totales", String(data.interviews_total));
    line("Entrevistas confirmadas", String(data.interviews_confirmed));
    line("Vacantes activas (categorías)", String(data.active_vacancies));
    y += 4; doc.setFontSize(12); doc.text("Por oficio", 14, y); y += 7;
    doc.setFontSize(10);
    for (const [k, v] of Object.entries(data.by_category)) { doc.text(`• ${k}: ${v}`, 18, y); y += 6; }
    doc.save(`reporte-rh-${Date.now()}.pdf`);
  };

  if (isLoading || !data) return <Spinner />;

  const kpis = [
    { label: "Total candidatos", value: data.total_candidates },
    { label: "Contratados", value: data.hired_count },
    { label: "Tasa aprobación", value: `${(data.approval_rate * 100).toFixed(1)}%` },
    { label: "Tiempo contratación", value: data.avg_hire_days ? `${data.avg_hire_days.toFixed(1)} d` : "—" },
    { label: "AI score prom.", value: data.avg_ai_score ? data.avg_ai_score.toFixed(0) : "—" },
    { label: "Entrevistas", value: data.interviews_total },
    { label: "Confirmadas", value: data.interviews_confirmed },
    { label: "Vacantes activas", value: data.active_vacancies },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={downloadCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs hover:bg-white/[0.06]">
          <Download className="h-3.5 w-3.5" /> Exportar CSV
        </button>
        <button onClick={downloadPDF} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs hover:bg-white/[0.06]">
          <Download className="h-3.5 w-3.5" /> Exportar PDF
        </button>
        <button onClick={async () => { const r = await riskFn(); toast.success(`Riesgo recalculado: ${r.count}`); refetch(); }}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/15 border border-primary/30 text-xs text-primary hover:brightness-110">
          <RefreshCw className="h-3.5 w-3.5" /> Recalcular riesgo
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50">{k.label}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <BreakdownCard title="Por oficio" data={data.by_category} />
        <BreakdownCard title="Por estatus" data={data.by_status} />
        <BreakdownCard title="Por fuente" data={data.by_source} />
      </div>
    </div>
  );
}

function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/50 mb-3">{title}</div>
      {entries.length === 0 && <div className="text-xs text-white/40">Sin datos</div>}
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k}>
            <div className="flex justify-between text-[11px] font-mono">
              <span className="uppercase tracking-wider">{k}</span><span className="tabular-nums text-white/60">{v}</span>
            </div>
            <div className="h-1.5 mt-1 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full bg-primary/60" style={{ width: `${(v / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── CALENDAR
function CalendarTab() {
  const listFn = useServerFn(listInterviews);
  const updFn = useServerFn(updateInterviewStatus);
  const candFn = useServerFn(listCandidates);
  const schedFn = useServerFn(scheduleInterview);
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["hr", "interviews"],
    queryFn: () => listFn({ data: {} }),
    refetchInterval: 30000,
  });
  const cands = useQuery({ queryKey: ["recruiting", "candidates"], queryFn: () => candFn() });

  const updMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => updFn({ data: { id: v.id, status: v.status as never } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr", "interviews"] }); toast.success("Estatus actualizado"); },
  });

  const grouped = useMemo(() => {
    const g: Record<string, NonNullable<typeof data>["interviews"]> = {};
    const items = data?.interviews ?? [];
    for (const iv of items) {
      const key = format(new Date(iv.scheduled_at), "yyyy-MM-dd");
      (g[key] ??= []).push(iv);
    }
    return g;
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-white/60">Total: {data?.interviews.length ?? 0} entrevistas</div>
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110">
          <Plus className="h-3.5 w-3.5" /> Agendar entrevista
        </button>
      </div>

      {showNew && (
        <NewInterviewForm
          candidates={cands.data?.candidates ?? []}
          onClose={() => setShowNew(false)}
          onSubmit={async (v) => {
            await schedFn({ data: v as never });
            toast.success("Entrevista agendada · WhatsApp enviado");
            qc.invalidateQueries({ queryKey: ["hr", "interviews"] });
            setShowNew(false);
          }}
        />
      )}

      {isLoading && <Spinner />}
      {Object.entries(grouped).map(([day, items]) => (
        <div key={day} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-widest text-primary">
            {format(new Date(day), "EEEE d 'de' MMMM", { locale: es })}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {items.map((iv) => {
              const cand = Array.isArray(iv.candidate) ? iv.candidate[0] : iv.candidate;
              return (
                <div key={iv.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-semibold text-sm">{cand?.full_name ?? "—"}</div>
                    <div className="text-[11px] text-white/55 font-mono">
                      {format(new Date(iv.scheduled_at), "HH:mm")} · {iv.mode} · {iv.duration_min}min
                      {iv.location && ` · ${iv.location}`}
                      {cand?.position && ` · ${cand.position}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${
                      iv.status === "confirmada" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" :
                      iv.status === "no_show" ? "bg-rose-500/15 text-rose-300 border-rose-400/30" :
                      iv.status === "completada" ? "bg-primary/15 text-primary border-primary/30" :
                      "bg-white/[0.04] text-white/60 border-white/10"
                    }`}>{iv.status}</span>
                    <select value={iv.status} onChange={(e) => updMut.mutate({ id: iv.id, status: e.target.value })}
                      className="h-8 text-xs bg-white/[0.04] border border-white/10 rounded px-2">
                      {["programada","confirmada","reprogramada","completada","no_show","cancelada"].map((s) =>
                        <option key={s} value={s} className="bg-[#0a0d12]">{s}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!isLoading && Object.keys(grouped).length === 0 && (
        <div className="p-12 text-center text-white/40 text-sm border border-dashed border-white/10 rounded-xl">
          Sin entrevistas agendadas. Agenda la primera.
        </div>
      )}
    </div>
  );
}

function NewInterviewForm({ candidates, onClose, onSubmit }: {
  candidates: Array<{ id: string; full_name: string | null; phone: string | null; position: string | null }>;
  onClose: () => void;
  onSubmit: (v: Record<string, unknown>) => Promise<void>;
}) {
  const [candidate_id, setCid] = useState("");
  const [scheduled_at, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [mode, setMode] = useState("presencial");
  const [location, setLoc] = useState("Oficinas SECOIVSA");
  const [duration_min, setDur] = useState(30);
  const [loading, setLoading] = useState(false);

  return (
    <form className="p-4 rounded-xl border border-primary/30 bg-primary/[0.04] grid md:grid-cols-2 gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!candidate_id) return toast.error("Selecciona candidato");
        setLoading(true);
        try { await onSubmit({ candidate_id, scheduled_at: new Date(scheduled_at).toISOString(), mode, location, duration_min }); }
        finally { setLoading(false); }
      }}>
      <Field label="Candidato">
        <select value={candidate_id} onChange={(e) => setCid(e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm">
          <option value="" className="bg-[#0a0d12]">— Selecciona —</option>
          {candidates.map((c) => <option key={c.id} value={c.id} className="bg-[#0a0d12]">{c.full_name ?? c.phone} · {c.position ?? ""}</option>)}
        </select>
      </Field>
      <Field label="Fecha y hora">
        <input type="datetime-local" value={scheduled_at} onChange={(e) => setDate(e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm" />
      </Field>
      <Field label="Modalidad">
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm">
          {["presencial","telefonica","videollamada"].map((m) => <option key={m} value={m} className="bg-[#0a0d12]">{m}</option>)}
        </select>
      </Field>
      <Field label="Duración (min)">
        <input type="number" value={duration_min} onChange={(e) => setDur(+e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm" />
      </Field>
      <Field label="Ubicación / link" className="md:col-span-2">
        <input value={location} onChange={(e) => setLoc(e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm" />
      </Field>
      <div className="md:col-span-2 flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="px-3 py-2 text-xs text-white/60 hover:text-white">Cancelar</button>
        <button disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
          {loading && <Loader2 className="h-3 w-3 animate-spin" />} Agendar y notificar
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[10px] font-mono uppercase tracking-widest text-white/50 mb-1">{label}</span>
      {children}
    </label>
  );
}

// ─────────────────────────────────────────────────────────── DOCUMENTS
function DocumentsTab() {
  const candFn = useServerFn(listCandidates);
  const upFn = useServerFn(uploadCandidateDocument);
  const revFn = useServerFn(revalidateDocument);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["recruiting", "candidates"], queryFn: () => candFn() });
  const [selected, setSelected] = useState<string>("");
  const [docType, setDocType] = useState<"ine"|"cv"|"comprobante_domicilio"|"curp"|"rfc"|"nss"|"otro">("ine");

  const handleFile = async (file: File) => {
    if (!selected) return toast.error("Selecciona candidato");
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    await upFn({ data: { candidate_id: selected, name: file.name, doc_type: docType, mime_type: file.type, base64: b64 } });
    toast.success("Documento subido · OCR en proceso");
    qc.invalidateQueries({ queryKey: ["recruiting"] });
  };

  const cand = data?.candidates.find((c) => c.id === selected);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <Field label="Candidato">
          <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm">
            <option value="" className="bg-[#0a0d12]">— Selecciona —</option>
            {data?.candidates.map((c) => <option key={c.id} value={c.id} className="bg-[#0a0d12]">{c.full_name ?? c.phone}</option>)}
          </select>
        </Field>
        <Field label="Tipo documento">
          <select value={docType} onChange={(e) => setDocType(e.target.value as never)} className="w-full h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm">
            {["ine","cv","comprobante_domicilio","curp","rfc","nss","otro"].map((t) =>
              <option key={t} value={t} className="bg-[#0a0d12]">{t}</option>)}
          </select>
        </Field>
        <Field label="Archivo">
          <label className="flex items-center gap-2 h-9 px-3 rounded bg-primary/15 border border-primary/30 text-xs font-mono cursor-pointer hover:brightness-110">
            <Upload className="h-3.5 w-3.5" /> Subir INE / CV / PDF
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </label>
        </Field>
      </div>

      {cand && (
        <CandidateDocsList candidateId={cand.id} onRevalidate={async (id) => {
          await revFn({ data: { id } }); toast.success("Documento revalidado"); qc.invalidateQueries();
        }} />
      )}
    </div>
  );
}

function CandidateDocsList({ candidateId, onRevalidate }: { candidateId: string; onRevalidate: (id: string) => void }) {
  const { data } = useQuery({
    queryKey: ["candidate-docs", candidateId],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("candidate_documents").select("*").eq("candidate_id", candidateId).order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 5000,
  });
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
      {(data ?? []).length === 0 && <div className="p-6 text-sm text-white/40 text-center">Sin documentos</div>}
      {(data ?? []).map((d) => {
        const status = (d as { validation_status?: string }).validation_status ?? "pendiente";
        const docType = (d as { doc_type?: string }).doc_type ?? "—";
        const notes = (d as { validation_notes?: string }).validation_notes;
        return (
          <div key={d.id} className="p-4 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary/70" /> {d.name}
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10">{docType}</span>
              </div>
              {notes && <div className="text-[11px] text-amber-300/80 mt-1">{notes}</div>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${
                status === "valido" ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" :
                status === "incompleto" ? "bg-amber-500/15 text-amber-300 border-amber-400/30" :
                status === "rechazado" ? "bg-rose-500/15 text-rose-300 border-rose-400/30" :
                "bg-white/[0.04] text-white/60 border-white/10"
              }`}>
                {status === "valido" && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                {status === "rechazado" && <XCircle className="h-3 w-3 inline mr-1" />}
                {status}
              </span>
              <button onClick={() => onRevalidate(d.id)} className="text-[10px] font-mono uppercase tracking-widest text-white/55 hover:text-white inline-flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Revalidar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────── BLACKLIST
function BlacklistTab() {
  const listFn = useServerFn(listBlacklist);
  const addFn = useServerFn(addToBlacklist);
  const delFn = useServerFn(removeFromBlacklist);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["hr", "blacklist"], queryFn: () => listFn() });
  const [phone, setPhone] = useState(""); const [reason, setReason] = useState(""); const [sev, setSev] = useState<"baja"|"media"|"alta">("media");

  return (
    <div className="space-y-4">
      <form className="p-4 rounded-xl border border-rose-400/20 bg-rose-500/[0.04] grid md:grid-cols-4 gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!phone || !reason) return;
          await addFn({ data: { phone, reason, severity: sev } });
          toast.success("Agregado a blacklist"); setPhone(""); setReason("");
          qc.invalidateQueries({ queryKey: ["hr", "blacklist"] });
        }}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" className="h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm" />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Razón" className="h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm md:col-span-2" />
        <div className="flex gap-2">
          <select value={sev} onChange={(e) => setSev(e.target.value as never)} className="flex-1 h-9 bg-white/[0.04] border border-white/10 rounded px-2 text-sm">
            {["baja","media","alta"].map((s) => <option key={s} value={s} className="bg-[#0a0d12]">{s}</option>)}
          </select>
          <button className="px-3 rounded bg-rose-500/80 text-white text-xs font-bold hover:brightness-110">+ Agregar</button>
        </div>
      </form>

      {isLoading && <Spinner />}
      <div className="rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
        {(data?.blacklist ?? []).map((b) => (
          <div key={b.id} className="p-4 flex justify-between items-center gap-2 flex-wrap">
            <div>
              <div className="font-semibold text-sm">+{b.phone} {b.full_name && <span className="text-white/55">· {b.full_name}</span>}</div>
              <div className="text-[11px] text-white/60 mt-1">{b.reason}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full border ${
                b.severity === "alta" ? "bg-rose-500/15 text-rose-300 border-rose-400/30" :
                b.severity === "media" ? "bg-amber-500/15 text-amber-300 border-amber-400/30" :
                "bg-white/[0.04] text-white/60 border-white/10"
              }`}>{b.severity}</span>
              <button onClick={async () => { await delFn({ data: { id: b.id } }); qc.invalidateQueries({ queryKey: ["hr","blacklist"] }); toast.success("Removido"); }}
                className="text-xs text-rose-300 hover:text-rose-200">Quitar</button>
            </div>
          </div>
        ))}
        {!isLoading && (data?.blacklist.length ?? 0) === 0 && <div className="p-6 text-center text-sm text-white/40">Blacklist vacía</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── AUDIT
function AuditTab() {
  const fn = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({ queryKey: ["hr", "audit"], queryFn: () => fn(), refetchInterval: 15000 });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="px-4 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-widest text-white/55">
        Bitácora auditable · {data?.logs.length ?? 0} eventos
      </div>
      {isLoading && <Spinner />}
      <div className="divide-y divide-white/[0.04] max-h-[70vh] overflow-y-auto">
        {(data?.logs ?? []).map((l) => (
          <div key={l.id} className="p-3 grid grid-cols-[1fr_auto] gap-2">
            <div>
              <div className="font-mono text-xs text-primary">{l.action}</div>
              <div className="text-[11px] text-white/55 mt-0.5">
                {l.entity_table ?? "—"} {l.entity_id ? `· ${l.entity_id.slice(0, 8)}` : ""}
              </div>
              {Object.keys((l.payload as Record<string, unknown>) ?? {}).length > 0 && (
                <pre className="mt-1 text-[10px] text-white/40 font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(l.payload, null, 0)}
                </pre>
              )}
            </div>
            <div className="text-[10px] text-white/40 font-mono whitespace-nowrap">
              {format(new Date(l.created_at), "dd/MM HH:mm:ss")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
}
