import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getOpsLiveDashboard,
  getProjectTimeline,
  listOpsProjects,
  quickProgressReport,
  quickEvidence,
  quickIncident,
} from "@/lib/operations-live.functions";
import {
  Activity, AlertTriangle, HardHat, ShieldCheck, Camera, FileText,
  Loader2, Plus, Mic, Radio, TrendingUp, DollarSign, Package, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/nexus/operations")({
  component: OperationsLivePage,
});

type Tab = "live" | "project" | "capture";

function OperationsLivePage() {
  const [tab, setTab] = useState<Tab>("live");
  const [projectId, setProjectId] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-gradient-to-b from-[#05070a] via-[#070a10] to-[#05070a] text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-[#05070a]/80 border-b border-white/[0.06] px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-3 max-w-[1700px] mx-auto">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              OPERATIONS · LIVE COMMAND CENTER
            </p>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mt-1">Operación en tiempo real</h1>
          </div>
          <div className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            {([["live", "Live", Radio], ["project", "Obra", HardHat], ["capture", "Captura", Camera]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition ${
                  tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>
                <I className="h-3.5 w-3.5" /> {l}
              </button>
            ))}
          </div>
        </div>
        {/* Mobile tab bar */}
        <nav className="md:hidden mt-3 flex gap-1 overflow-x-auto -mx-1 px-1">
          {([["live", "Live", Radio], ["project", "Obra", HardHat], ["capture", "Captura", Camera]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase shrink-0 ${
                tab === k ? "bg-primary text-primary-foreground" : "bg-white/[0.04] text-muted-foreground"
              }`}>
              <I className="h-3 w-3" /> {l}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-4 lg:px-8 py-6 max-w-[1700px] mx-auto">
        {tab === "live" && <LiveDashboard onPickProject={(id) => { setProjectId(id); setTab("project"); }} />}
        {tab === "project" && <ProjectTimeline projectId={projectId} onClear={() => setProjectId(null)} />}
        {tab === "capture" && <SupervisorCapture />}
      </main>
    </div>
  );
}

// ============================================================
// LIVE DASHBOARD
// ============================================================
function LiveDashboard({ onPickProject }: { onPickProject: (id: string) => void }) {
  const fetchLive = useServerFn(getOpsLiveDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["ops-live"],
    queryFn: () => fetchLive(),
    refetchInterval: 15000,
  });

  if (isLoading || !data) return <CenterLoader />;
  const k = data.kpis;

  const tiles = [
    { label: "Obras activas", value: k.activeProjects, icon: HardHat, accent: "from-blue-500/30 to-blue-500/0" },
    { label: "Personal en sitio", value: k.personnelOnSite, icon: Activity, accent: "from-emerald-500/30 to-emerald-500/0" },
    { label: "Avance promedio", value: `${k.avgProgress}%`, icon: TrendingUp, accent: "from-cyan-500/30 to-cyan-500/0" },
    { label: "Alertas críticas", value: k.criticalAlerts, icon: AlertTriangle, accent: "from-rose-500/30 to-rose-500/0" },
    { label: "Incidentes abiertos", value: k.openIncidents, icon: ShieldCheck, accent: "from-orange-500/30 to-orange-500/0" },
    { label: "Permisos activos", value: k.activePermits, icon: FileText, accent: "from-amber-500/30 to-amber-500/0" },
    { label: "Evidencias hoy", value: k.evidencesToday, icon: Camera, accent: "from-violet-500/30 to-violet-500/0" },
    { label: "Reportes avance hoy", value: k.progressEntriesToday, icon: Radio, accent: "from-fuchsia-500/30 to-fuchsia-500/0" },
    { label: "Stock bajo", value: k.lowStockCount, icon: Package, accent: "from-yellow-500/30 to-yellow-500/0" },
    { label: "Gasto mes", value: `$${Math.round(k.monthSpend).toLocaleString("es-MX")}`, icon: DollarSign, accent: "from-teal-500/30 to-teal-500/0" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI grid mobile-first */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-4`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${t.accent} opacity-60 pointer-events-none`} />
            <div className="relative">
              <t.icon className="h-4 w-4 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold tracking-tight">{t.value}</div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">{t.label}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active projects */}
        <section className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <header className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider">Obras activas</h2>
            <span className="text-[10px] font-mono text-muted-foreground">{data.projects.length}</span>
          </header>
          <ul className="divide-y divide-white/[0.04] max-h-[480px] overflow-y-auto">
            {data.projects.length === 0 && <li className="p-6 text-sm text-muted-foreground text-center">Sin obras activas.</li>}
            {data.projects.map((p) => (
              <li key={p.id}>
                <button onClick={() => onPickProject(p.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition text-left">
                  <span className={`h-2 w-2 rounded-full ${p.status === "en_curso" ? "bg-emerald-400" : p.status === "pausado" ? "bg-amber-400" : "bg-blue-400"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{p.name}</div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">{p.status}</div>
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Number(p.progress_pct ?? 0)}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-right text-muted-foreground mt-1">{Number(p.progress_pct ?? 0)}%</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Critical alerts + incidents */}
        <section className="space-y-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04]">
            <header className="px-4 py-3 border-b border-rose-500/10 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-rose-200">Alertas críticas</h2>
            </header>
            <ul className="divide-y divide-rose-500/10 max-h-56 overflow-y-auto">
              {data.alerts.length === 0 && <li className="p-4 text-xs text-muted-foreground text-center">Sin alertas críticas.</li>}
              {data.alerts.map((a) => (
                <li key={a.id} className="px-4 py-2.5">
                  <div className="text-xs font-medium">{a.title}</div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">{a.source} · {format(new Date(a.created_at), "HH:mm", { locale: es })}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
            <header className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-orange-400" />
              <h2 className="text-sm font-mono uppercase tracking-wider">Incidentes abiertos</h2>
            </header>
            <ul className="divide-y divide-white/[0.04] max-h-56 overflow-y-auto">
              {data.incidents.length === 0 && <li className="p-4 text-xs text-muted-foreground text-center">Sin incidentes activos.</li>}
              {data.incidents.map((i) => (
                <li key={i.id} className="px-4 py-2.5 flex items-start gap-2">
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${i.severity === "fatal" ? "bg-rose-500" : i.severity === "grave" ? "bg-orange-400" : "bg-amber-400"}`} />
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{i.title}</div>
                    <div className="text-[10px] font-mono uppercase text-muted-foreground">{i.severity}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Evidences strip */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <header className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Camera className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-mono uppercase tracking-wider">Evidencias del día</h2>
        </header>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.evidences.length === 0 && <div className="col-span-full text-xs text-muted-foreground text-center py-6">Sin evidencias hoy.</div>}
          {data.evidences.map((e) => (
            <a key={e.id} href={e.file_url} target="_blank" rel="noreferrer"
              className="group block aspect-square rounded-lg overflow-hidden border border-white/[0.06] bg-black relative">
              {e.kind === "foto" ? (
                <img src={e.file_url} alt={e.title ?? "evidencia"} className="w-full h-full object-cover group-hover:scale-105 transition" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileText className="h-6 w-6" /></div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="text-[9px] font-mono uppercase text-white/80">{format(new Date(e.created_at), "HH:mm")}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================================================
// PROJECT TIMELINE
// ============================================================
function ProjectTimeline({ projectId, onClear }: { projectId: string | null; onClear: () => void }) {
  const fetchTl = useServerFn(getProjectTimeline);
  const { data, isLoading } = useQuery({
    queryKey: ["ops-timeline", projectId],
    queryFn: () => fetchTl({ data: { projectId: projectId! } }),
    enabled: !!projectId,
    refetchInterval: 30000,
  });

  if (!projectId) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
        <HardHat className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Selecciona una obra desde el dashboard Live.</p>
      </div>
    );
  }
  if (isLoading || !data) return <CenterLoader />;

  const p = data.project;
  return (
    <div className="space-y-4">
      <button onClick={onClear} className="text-xs font-mono uppercase tracking-wider text-primary hover:underline">← Volver al Live</button>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{p?.status}</div>
        <h2 className="text-2xl font-bold mt-1">{p?.name}</h2>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div>Avance: <span className="text-foreground font-mono">{Number(p?.progress_pct ?? 0)}%</span></div>
          <div>Equipo: <span className="text-foreground font-mono">{data.team.length}</span></div>
          <div>Permisos: <span className="text-foreground font-mono">{data.permits.length}</span></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Bitácora / avances" empty="Sin reportes de avance." count={data.progress.length}>
          {data.progress.map((e) => (
            <div key={e.id} className="px-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{e.title}</div>
                <span className="text-[10px] font-mono text-primary">{Number(e.progress_pct)}%</span>
              </div>
              {e.description && <div className="text-xs text-muted-foreground mt-1">{e.description}</div>}
              <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">
                {e.reported_at} · {e.personnel_count} pers · {Number(e.hours)}h
              </div>
            </div>
          ))}
        </Section>

        <Section title="Incidentes" empty="Sin incidentes." count={data.incidents.length}>
          {data.incidents.map((i) => (
            <div key={i.id} className="px-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${String(i.severity) === "fatal" ? "bg-rose-500" : String(i.severity) === "grave" ? "bg-orange-400" : "bg-amber-400"}`} />
                <div className="text-sm font-medium">{i.title}</div>
              </div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground mt-1">{i.severity} · {format(new Date(i.occurred_at), "dd MMM HH:mm", { locale: es })}</div>
            </div>
          ))}
        </Section>

        <Section title="Permisos de trabajo" empty="Sin permisos." count={data.permits.length}>
          {data.permits.map((p) => (
            <div key={p.id} className="px-4 py-3 border-b border-white/[0.04] last:border-0">
              <div className="text-sm font-medium">{p.folio} · {p.permit_type}</div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">{p.status} · vence {p.valid_to ?? "—"}</div>
            </div>
          ))}
        </Section>

        <Section title="Evidencias" empty="Sin evidencias." count={data.evidences.length}>
          <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {data.evidences.map((e) => (
              <a key={e.id} href={e.file_url} target="_blank" rel="noreferrer"
                className="block aspect-square rounded-md overflow-hidden border border-white/[0.06] bg-black">
                {e.kind === "foto" ? (
                  <img src={e.file_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </a>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, count, children, empty }: { title: string; count: number; children: React.ReactNode; empty: string }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <header className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider">{title}</h3>
        <span className="text-[10px] font-mono text-muted-foreground">{count}</span>
      </header>
      <div className="max-h-[400px] overflow-y-auto">
        {count === 0 ? <div className="p-6 text-xs text-muted-foreground text-center">{empty}</div> : children}
      </div>
    </section>
  );
}

// ============================================================
// SUPERVISOR CAPTURE (mobile-first quick entry + voice + photo)
// ============================================================
function SupervisorCapture() {
  const qc = useQueryClient();
  const fetchProjects = useServerFn(listOpsProjects);
  const { data: projects } = useQuery({ queryKey: ["ops-proj-list"], queryFn: () => fetchProjects() });

  const [mode, setMode] = useState<"progress" | "evidence" | "incident">("progress");
  const [projectId, setProjectId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [pct, setPct] = useState(50);
  const [personnel, setPersonnel] = useState(0);
  const [hours, setHours] = useState(8);
  const [severity, setSeverity] = useState<"leve" | "grave" | "fatal">("leve");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [listening, setListening] = useState(false);

  const submitProg = useServerFn(quickProgressReport);
  const submitEvid = useServerFn(quickEvidence);
  const submitInc = useServerFn(quickIncident);

  const reset = () => { setTitle(""); setDesc(""); setPct(50); setPersonnel(0); setHours(8); setFile(null); };

  const mut = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Selecciona una obra");
      if (mode === "progress") {
        if (!title.trim()) throw new Error("Título requerido");
        await submitProg({ data: { project_id: projectId, title, description: desc, progress_pct: pct, personnel_count: personnel, hours } });
      } else if (mode === "incident") {
        if (!title.trim()) throw new Error("Título requerido");
        await submitInc({ data: { project_id: projectId, title, description: desc, severity } });
      } else {
        if (!file) throw new Error("Selecciona un archivo");
        setUploading(true);
        const path = `${projectId}/${Date.now()}-${file.name}`;
        const up = await supabase.storage.from("evidences").upload(path, file, { upsert: false });
        if (up.error) { setUploading(false); throw new Error(up.error.message); }
        const { data: signed } = await supabase.storage.from("evidences").createSignedUrl(path, 60 * 60 * 24 * 365);
        const url = signed?.signedUrl ?? "";
        const kind: "foto" | "video" | "documento" = file.type.startsWith("image/") ? "foto" : file.type.startsWith("video/") ? "video" : "documento";
        await submitEvid({ data: { project_id: projectId, title: title || file.name, description: desc, file_url: url, kind } });
        setUploading(false);
      }
    },
    onSuccess: () => {
      toast.success("Capturado correctamente");
      reset();
      qc.invalidateQueries({ queryKey: ["ops-live"] });
      qc.invalidateQueries({ queryKey: ["ops-timeline"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Voice to text (Web Speech API)
  const startDictation = () => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown };
    const SR = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SR) { toast.error("Tu navegador no soporta dictado por voz"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new SR();
    r.lang = "es-MX"; r.continuous = false; r.interimResults = false;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (ev: any) => {
      const text = ev.results[0]?.[0]?.transcript ?? "";
      setDesc((d) => (d ? d + " " : "") + text);
    };
    r.start();
  };


  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 grid grid-cols-3 gap-1">
        {(["progress", "evidence", "incident"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition ${
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {m === "progress" ? "Avance" : m === "evidence" ? "Evidencia" : "Incidente"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <Field label="Obra">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm">
            <option value="">— Selecciona obra —</option>
            {(projects ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {mode !== "evidence" && (
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm" />
          </Field>
        )}

        {mode === "evidence" && (
          <Field label="Archivo (foto, video, audio, documento)">
            <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground" />
            {file && <div className="text-[10px] font-mono text-muted-foreground mt-1">{file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB</div>}
          </Field>
        )}

        <Field label={<span className="flex items-center justify-between"><span>Descripción / observación</span>
          <button type="button" onClick={startDictation}
            className={`text-[10px] font-mono uppercase flex items-center gap-1 px-2 py-0.5 rounded-full border ${listening ? "border-rose-400 text-rose-300 animate-pulse" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
            <Mic className="h-3 w-3" /> {listening ? "escuchando" : "dictar"}
          </button>
        </span>}>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} maxLength={2000}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm" />
        </Field>

        {mode === "progress" && (
          <>
            <Field label={`Avance: ${pct}%`}>
              <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Personal">
                <input type="number" min={0} value={personnel} onChange={(e) => setPersonnel(Number(e.target.value))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm" />
              </Field>
              <Field label="Horas">
                <input type="number" min={0} step="0.5" max={24} value={hours} onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm" />
              </Field>
            </div>
          </>
        )}

        {mode === "incident" && (
          <Field label="Severidad">
            <div className="grid grid-cols-3 gap-2">
              {(["leve", "grave", "fatal"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSeverity(s)}
                  className={`py-2.5 rounded-lg text-xs font-mono uppercase border transition ${
                    severity === s
                      ? s === "fatal" ? "bg-rose-500/20 border-rose-500 text-rose-200"
                      : s === "grave" ? "bg-orange-500/20 border-orange-500 text-orange-200"

                      : "bg-amber-500/20 border-amber-500 text-amber-200"
                      : "border-white/[0.08] text-muted-foreground hover:text-foreground"
                  }`}>{s}</button>
              ))}
            </div>
          </Field>
        )}

        <button disabled={mut.isPending || uploading}
          onClick={() => mut.mutate()}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
          {(mut.isPending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {uploading ? "Subiendo evidencia..." : "Registrar captura"}
        </button>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground text-center">
        Captura rápida supervisor · voz-a-texto · foto desde cámara · sincroniza con Live en tiempo real
      </p>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">{label}</span>
      {children}
    </label>
  );
}

function CenterLoader() {
  return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}
