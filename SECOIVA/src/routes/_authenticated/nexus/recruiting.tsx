import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listCandidates, getCandidate, updateCandidateStatus,
  sendWhatsAppReply, simulateInboundMessage,
} from "@/lib/recruiting.functions";
import { UserPlus, MessageCircle, Send, Loader2, Clock, FileText, Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/nexus/recruiting")({
  component: RecruitingPage,
});

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  nuevo: { label: "Nuevo", tone: "bg-sky-500/15 text-sky-300 border-sky-400/30" },
  en_revision: { label: "En revisión", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  entrevista: { label: "Entrevista", tone: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
  aceptado: { label: "Aceptado", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  rechazado: { label: "Rechazado", tone: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  contratado: { label: "Contratado", tone: "bg-emerald-500/25 text-emerald-200 border-emerald-400/40" },
  descartado: { label: "Descartado", tone: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
};

function RecruitingPage() {
  const listFn = useServerFn(listCandidates);
  const { data, isLoading } = useQuery({
    queryKey: ["recruiting", "candidates"],
    queryFn: () => listFn(),
    refetchInterval: 15000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const candidates = data?.candidates ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const cc = c as { category?: string; urgency?: string; specialty?: string; city?: string };
      if (filter !== "all" && c.status !== filter) return false;
      if (categoryFilter !== "all" && cc.category !== categoryFilter) return false;
      if (urgencyFilter !== "all" && cc.urgency !== urgencyFilter) return false;
      if (q) {
        const hay = `${c.full_name ?? ""} ${c.phone ?? ""} ${c.position ?? ""} ${cc.specialty ?? ""} ${cc.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [candidates, filter, categoryFilter, urgencyFilter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of candidates) c[k.status] = (c[k.status] ?? 0) + 1;
    return c;
  }, [candidates]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const k of candidates) {
      const cat = (k as { category?: string }).category;
      if (cat) c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [candidates]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            RH · recruiting workflow
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <UserPlus className="h-7 w-7 text-primary" /> Reclutamiento
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Candidatos entrantes desde web y WhatsApp Business. Bot RH activo · clasificación automática.
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(["nuevo","en_revision","entrevista","aceptado","contratado","rechazado"] as const).map((k) => (
            <div key={k} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/50">{STATUS_LABELS[k].label}</div>
              <div className="text-xl font-bold tabular-nums">{counts[k] ?? 0}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border transition ${filter === "all" ? "bg-primary/15 border-primary/30 text-primary" : "border-white/10 text-white/55 hover:text-white"}`}
        >
          Todos · {candidates.length}
        </button>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border transition ${filter === k ? v.tone : "border-white/10 text-white/55 hover:text-white"}`}
          >
            {v.label} · {counts[k] ?? 0}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nombre, tel, puesto…"
            className="h-8 w-56 rounded-full bg-white/[0.04] border border-white/10 px-3 text-xs focus:outline-none focus:border-primary/60"
          />
          <SimulateButton />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35 mr-1">Oficio</span>
        <button
          onClick={() => setCategoryFilter("all")}
          className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border transition ${categoryFilter === "all" ? "bg-primary/15 border-primary/30 text-primary" : "border-white/10 text-white/50 hover:text-white"}`}
        >
          Todos
        </button>
        {(["soldador","tubero","supervisor","seguridad","calidad","operador","electricista","maniobrista","almacen","administrativo","ingenieria","otro"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border transition ${categoryFilter === cat ? "bg-primary/15 border-primary/30 text-primary" : "border-white/10 text-white/50 hover:text-white"}`}
          >
            {cat} · {categoryCounts[cat] ?? 0}
          </button>
        ))}
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35 ml-3 mr-1">Prioridad</span>
        {(["all","alta","media","baja"] as const).map((u) => (
          <button
            key={u}
            onClick={() => setUrgencyFilter(u)}
            className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border transition ${urgencyFilter === u ? (u === "alta" ? "bg-rose-500/15 border-rose-400/40 text-rose-300" : u === "media" ? "bg-amber-500/15 border-amber-400/40 text-amber-300" : "bg-primary/15 border-primary/30 text-primary") : "border-white/10 text-white/50 hover:text-white"}`}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-widest text-white/55">
            Candidatos · {filtered.length}
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/[0.04]">
            {isLoading && <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
            {!isLoading && filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-white/40">Sin candidatos en este filtro.</div>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-4 hover:bg-white/[0.03] transition ${selectedId === c.id ? "bg-primary/[0.06]" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm truncate">{c.full_name ?? `+${c.phone ?? "?"}`}</div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(c as { urgency?: string }).urgency === "alta" && (
                      <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-400/30">URGENTE</span>
                    )}
                    {(c as { category?: string }).category && (
                      <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/10">
                        {(c as { category?: string }).category}
                      </span>
                    )}
                    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_LABELS[c.status]?.tone ?? ""}`}>
                      {STATUS_LABELS[c.status]?.label ?? c.status}
                    </span>
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-white/55 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono">
                  {c.position && <span>· {c.position}</span>}
                  {(c as { specialty?: string }).specialty && <span>· {(c as { specialty?: string }).specialty}</span>}
                  {(c as { seniority?: string }).seniority && <span className="uppercase">{(c as { seniority?: string }).seniority}</span>}
                  {typeof (c as { ai_score?: number }).ai_score === "number" && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                      AI {(c as { ai_score?: number }).ai_score}
                    </span>
                  )}
                  <span className="uppercase tracking-widest">{c.source}</span>
                  <span>{formatDistanceToNow(new Date(c.created_at), { locale: es, addSuffix: true })}</span>
                </div>
                {(c as { ai_summary?: string }).ai_summary && (
                  <div className="mt-1 text-[11px] text-white/60 italic line-clamp-1">
                    “{(c as { ai_summary?: string }).ai_summary}”
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          {selectedId ? <CandidateDetail id={selectedId} /> : (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-white/40">
              Selecciona un candidato para ver expediente, conversación y timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CandidateDetail({ id }: { id: string }) {
  const detailFn = useServerFn(getCandidate);
  const updateFn = useServerFn(updateCandidateStatus);
  const sendFn = useServerFn(sendWhatsAppReply);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["recruiting", "candidate", id],
    queryFn: () => detailFn({ data: { id } }),
    refetchInterval: 10000,
  });

  const updateMut = useMutation({
    mutationFn: (status: string) => updateFn({ data: { id, status: status as never } }),
    onSuccess: () => {
      toast.success("Estatus actualizado");
      qc.invalidateQueries({ queryKey: ["recruiting"] });
    },
  });

  const [reply, setReply] = useState("");
  const sendMut = useMutation({
    mutationFn: (body: string) => sendFn({ data: { candidate_id: id, body } }),
    onSuccess: (res) => {
      if (res.ok) { setReply(""); toast.success("Mensaje enviado"); }
      else toast.error(`Error: ${res.error ?? "envío fallido"}`);
      qc.invalidateQueries({ queryKey: ["recruiting", "candidate", id] });
    },
  });

  if (isLoading || !data?.candidate) {
    return <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }
  const c = data.candidate;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold">{c.full_name ?? `+${c.phone}`}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/60 font-mono">
              {c.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> +{c.phone}</span>}
              {c.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</span>}
              {c.position && <span className="inline-flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-primary/70" /> {c.position}</span>}
              {(c as { city?: string }).city && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {(c as { city?: string }).city}</span>
              )}
              {(c as { age?: number }).age && <span>· {(c as { age?: number }).age} años</span>}
              {(c as { availability?: string }).availability && <span>· disp. {(c as { availability?: string }).availability}</span>}
              {(c as { category?: string }).category && (
                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/10 uppercase">{(c as { category?: string }).category}</span>
              )}
              {typeof (c as { ai_score?: number }).ai_score === "number" && (
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">AI {(c as { ai_score?: number }).ai_score}/100</span>
              )}
            </div>
          </div>
          <select
            value={c.status}
            onChange={(e) => updateMut.mutate(e.target.value)}
            className="h-9 rounded-lg bg-white/[0.04] border border-white/10 px-3 text-xs text-white focus:outline-none"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#0a0d12]">{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col max-h-[60vh]">
          <div className="px-4 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-widest text-white/55 flex items-center gap-2">
            <MessageCircle className="h-3 w-3" /> Conversación
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {data.messages.length === 0 && <div className="text-center text-xs text-white/40 py-6">Sin mensajes aún</div>}
            {data.messages.map((m) => (
              <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.direction === "out" ? "bg-primary/15 border border-primary/25" : "bg-white/[0.04] border border-white/10"}`}>
                  <div className="whitespace-pre-wrap leading-snug">{m.body}</div>
                  <div className="mt-1 text-[9px] font-mono uppercase tracking-widest text-white/40">
                    {m.channel} · {formatDistanceToNow(new Date(m.created_at), { locale: es, addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {c.phone && (
            <div className="p-3 border-t border-white/[0.06] flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Responder por WhatsApp..."
                className="flex-1 h-9 rounded-lg bg-white/[0.04] border border-white/10 px-3 text-sm focus:outline-none focus:border-primary/60"
                onKeyDown={(e) => { if (e.key === "Enter" && reply.trim()) sendMut.mutate(reply.trim()); }}
              />
              <button
                onClick={() => reply.trim() && sendMut.mutate(reply.trim())}
                disabled={sendMut.isPending || !reply.trim()}
                className="px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 disabled:opacity-50"
              >
                {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col max-h-[60vh]">
          <div className="px-4 py-3 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-widest text-white/55 flex items-center gap-2">
            <Clock className="h-3 w-3" /> Timeline · {data.timeline.length}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {data.timeline.length === 0 && <div className="text-center text-xs text-white/40 py-6">Sin eventos</div>}
            {data.timeline.map((t) => (
              <div key={t.id} className="border-l-2 border-primary/30 pl-3">
                <div className="text-xs font-semibold">{t.title}</div>
                {t.description && <div className="text-[11px] text-white/55 mt-0.5">{t.description}</div>}
                <div className="text-[9px] font-mono uppercase tracking-widest text-white/35 mt-1">
                  {t.event_type} · {formatDistanceToNow(new Date(t.created_at), { locale: es, addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
          {data.documents.length > 0 && (
            <div className="border-t border-white/[0.06] p-3 space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-white/55 flex items-center gap-1.5"><FileText className="h-3 w-3" /> Documentos</div>
              {data.documents.map((d) => (
                <div key={d.id} className="text-xs flex items-center gap-2 text-white/70">
                  <FileText className="h-3 w-3" /> {d.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimulateButton() {
  const fn = useServerFn(simulateInboundMessage);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("528449122103");
  const [body, setBody] = useState("Hola, busco trabajo de soldador");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => fn({ data: { from, body } }),
    onSuccess: () => { toast.success("Mensaje simulado procesado"); qc.invalidateQueries({ queryKey: ["recruiting"] }); setOpen(false); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04]">
        Simular mensaje WA
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/[0.04]">
      <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="52833..." className="h-8 rounded bg-white/[0.05] border border-white/10 px-2 text-xs w-36" />
      <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensaje..." className="h-8 rounded bg-white/[0.05] border border-white/10 px-2 text-xs flex-1 min-w-[200px]" />
      <button onClick={() => mut.mutate()} disabled={mut.isPending} className="h-8 px-3 rounded bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-widest font-bold disabled:opacity-50">
        {mut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Procesar"}
      </button>
      <button onClick={() => setOpen(false)} className="h-8 px-2 text-[10px] text-white/50 hover:text-white">×</button>
    </div>
  );
}
