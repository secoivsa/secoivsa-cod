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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  UserPlus,
  Plus,
  Building2,
  TrendingUp,
  FileText,
  Activity as ActivityIcon,
  Mail,
  Phone,
  ArrowRight,
  Check,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"] & {
  client?: Pick<Client, "id" | "name"> | null;
};
type Quote = Database["public"]["Tables"]["quotes"]["Row"] & {
  client?: Pick<Client, "id" | "name"> | null;
};

const STAGES = [
  { id: "prospecto", label: "Prospecto", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "contactado", label: "Contactado", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "cotizacion", label: "Cotización", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "negociacion", label: "Negociación", color: "bg-orange-500/15 text-orange-300 border-orange-400/30" },
  { id: "aprobado", label: "Aprobado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "perdido", label: "Perdido", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
] as const;

type Stage = (typeof STAGES)[number]["id"];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export const Route = createFileRoute("/_authenticated/nexus/crm")({
  component: CrmPage,
});

function CrmPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            09 · CRM · pipeline comercial
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight">Relaciones comerciales</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Clientes, oportunidades y cotizaciones conectados al núcleo operativo de NEXUS OS.
          </p>
        </div>
      </header>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 h-auto">
          <TabsTrigger value="pipeline" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <TrendingUp className="h-3.5 w-3.5 mr-2" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="clients" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <Building2 className="h-3.5 w-3.5 mr-2" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="quotes" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <FileText className="h-3.5 w-3.5 mr-2" /> Cotizaciones
          </TabsTrigger>
          <TabsTrigger value="activities" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <ActivityIcon className="h-3.5 w-3.5 mr-2" /> Actividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineBoard orgId={orgId} />
        </TabsContent>
        <TabsContent value="clients" className="mt-6">
          <ClientsTab orgId={orgId} />
        </TabsContent>
        <TabsContent value="quotes" className="mt-6">
          <QuotesTab orgId={orgId} />
        </TabsContent>
        <TabsContent value="activities" className="mt-6">
          <ActivitiesTab orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== PIPELINE ============== */
function PipelineBoard({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const { data: opps = [] } = useQuery({
    queryKey: ["crm", "opportunities", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: rows, error }, { data: cls }] = await Promise.all([
        supabase.from("opportunities").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name"),
      ]);
      if (error) throw error;
      const map = new Map((cls ?? []).map((c) => [c.id, c]));
      return (rows ?? []).map((r) => ({ ...r, client: r.client_id ? map.get(r.client_id) ?? null : null })) as Opportunity[];
    },
  });

  const moveStage = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("opportunities").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["crm"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["nexus", "core", "kpis"] });
      if (vars.stage === "aprobado") toast.success("Oportunidad aprobada · proyecto creado automáticamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totalsByStage = STAGES.map((s) => ({
    ...s,
    total: opps.filter((o) => o.stage === s.id).reduce((acc, o) => acc + Number(o.value ?? 0), 0),
    count: opps.filter((o) => o.stage === s.id).length,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Pipeline total
          </span>
          <span className="font-mono font-semibold">
            {fmtMoney(opps.reduce((s, o) => s + Number(o.value ?? 0), 0))}
          </span>
          <span className="text-muted-foreground font-mono">{opps.length} oportunidades</span>
        </div>
        <NewOpportunitySheet orgId={orgId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {totalsByStage.map((stage) => {
          const stageOpps = opps.filter((o) => o.stage === stage.id);
          return (
            <div
              key={stage.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 min-h-[320px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/[0.06]">
                <div>
                  <div className={`inline-flex px-2 py-0.5 rounded-md border font-mono text-[10px] uppercase tracking-[0.15em] ${stage.color}`}>
                    {stage.label}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground font-mono">
                    {stage.count} · {fmtMoney(stage.total)}
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {stageOpps.map((o) => (
                  <OppCard
                    key={o.id}
                    opp={o}
                    onMove={(stage) => moveStage.mutate({ id: o.id, stage })}
                  />
                ))}
                {stageOpps.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider py-6 text-center">
                    sin oportunidades
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OppCard({ opp, onMove }: { opp: Opportunity; onMove: (s: Stage) => void }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0a0d12] p-3 hover:border-primary/40 transition group">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
        {opp.client?.name ?? "Sin cliente"}
      </div>
      <div className="mt-1 text-sm font-medium leading-snug">{opp.title}</div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-xs font-semibold">{fmtMoney(Number(opp.value))}</span>
        <span className="text-[10px] text-muted-foreground font-mono">{opp.probability}%</span>
      </div>
      <Select value={opp.stage} onValueChange={(v) => onMove(v as Stage)}>
        <SelectTrigger className="h-7 mt-2 text-[10px] font-mono uppercase tracking-wider bg-white/[0.02] border-white/[0.06]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGES.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NewOpportunitySheet({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState("30");
  const [stage, setStage] = useState<Stage>("prospecto");

  const { data: clients = [] } = useQuery({
    queryKey: ["crm", "clients-mini", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name").order("name");
      return (data ?? []) as Pick<Client, "id" | "name">[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { error } = await supabase.from("opportunities").insert({
        organization_id: orgId,
        title,
        client_id: clientId || null,
        value: Number(value) || 0,
        probability: Number(probability) || 0,
        stage,
        created_by: user?.id ?? null,
        owner_id: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm"] });
      toast.success("Oportunidad creada");
      setOpen(false);
      setTitle(""); setValue(""); setClientId(""); setProbability("30"); setStage("prospecto");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva oportunidad
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nueva oportunidad</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cliente</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Valor (MXN)</Label>
              <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="mt-1.5 font-mono" />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Probabilidad %</Label>
              <Input type="number" value={probability} onChange={(e) => setProbability(e.target.value)} className="mt-1.5 font-mono" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Etapa inicial</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending} className="w-full">
            {create.isPending ? "Creando…" : "Crear oportunidad"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== CLIENTS ============== */
function ClientsTab({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rfc: "", industry: "", contact_name: "", contact_email: "", contact_phone: "", city: "" });

  const { data: clients = [] } = useQuery({
    queryKey: ["crm", "clients", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Client[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { error } = await supabase.from("clients").insert({
        organization_id: orgId,
        created_by: user?.id ?? null,
        ...form,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm"] });
      qc.invalidateQueries({ queryKey: ["nexus", "core", "kpis"] });
      toast.success("Cliente creado");
      setOpen(false);
      setForm({ name: "", rfc: "", industry: "", contact_name: "", contact_email: "", contact_phone: "", city: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {clients.length} cliente{clients.length === 1 ? "" : "s"}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Nuevo cliente
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nuevo cliente</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              {[
                { k: "name", label: "Razón social / nombre" },
                { k: "rfc", label: "RFC" },
                { k: "industry", label: "Industria" },
                { k: "contact_name", label: "Contacto" },
                { k: "contact_email", label: "Correo" },
                { k: "contact_phone", label: "Teléfono" },
                { k: "city", label: "Ciudad" },
              ].map((f) => (
                <div key={f.k}>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                  <Input
                    value={(form as Record<string, string>)[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              ))}
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending} className="w-full">
                {create.isPending ? "Creando…" : "Crear cliente"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Industria</th>
              <th className="px-4 py-3 text-left">Contacto</th>
              <th className="px-4 py-3 text-left">Ciudad</th>
              <th className="px-4 py-3 text-left">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  {c.rfc && <div className="text-[10px] font-mono text-muted-foreground">{c.rfc}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.industry ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="text-foreground/90">{c.contact_name ?? "—"}</div>
                  <div className="flex gap-3 text-[10px] font-mono text-muted-foreground mt-0.5">
                    {c.contact_email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.contact_email}</span>}
                    {c.contact_phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.contact_phone}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">{c.status}</Badge>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">Sin clientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============== QUOTES ============== */
function QuotesTab({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<{ description: string; quantity: string; unit_price: string }[]>([
    { description: "", quantity: "1", unit_price: "0" },
  ]);

  const { data: quotes = [] } = useQuery({
    queryKey: ["crm", "quotes", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: rows, error }, { data: cls }] = await Promise.all([
        supabase.from("quotes").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("id,name"),
      ]);
      if (error) throw error;
      const map = new Map((cls ?? []).map((c) => [c.id, c]));
      return (rows ?? []).map((r) => ({ ...r, client: r.client_id ? map.get(r.client_id) ?? null : null })) as Quote[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["crm", "clients-mini", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id,name").order("name");
      return (data ?? []) as Pick<Client, "id" | "name">[];
    },
  });

  const subtotal = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { data: q, error } = await supabase
        .from("quotes")
        .insert({
          organization_id: orgId,
          folio: "",
          client_id: clientId || null,
          title: title || null,
          valid_until: validUntil || null,
          subtotal, tax, total,
          status: "borrador",
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      if (items.length) {
        const rows = items
          .filter((i) => i.description.trim())
          .map((i, idx) => ({
            quote_id: q.id,
            description: i.description,
            quantity: Number(i.quantity) || 0,
            unit_price: Number(i.unit_price) || 0,
            total: (Number(i.quantity) || 0) * (Number(i.unit_price) || 0),
            order_idx: idx,
          }));
        if (rows.length) {
          const { error: e2 } = await supabase.from("quote_items").insert(rows);
          if (e2) throw e2;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm", "quotes"] });
      toast.success("Cotización generada");
      setOpen(false);
      setTitle(""); setClientId(""); setValidUntil("");
      setItems([{ description: "", quantity: "1", unit_price: "0" }]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    borrador: "bg-slate-500/15 text-slate-300 border-slate-400/30",
    enviada: "bg-blue-500/15 text-blue-300 border-blue-400/30",
    aprobada: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    rechazada: "bg-rose-500/15 text-rose-300 border-rose-400/30",
    vencida: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
          {quotes.length} cotización(es) · {fmtMoney(quotes.reduce((s, q) => s + Number(q.total), 0))}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva cotización
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nueva cotización</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Concepto / proyecto</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Vigencia</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1.5 font-mono" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Conceptos</Label>
                <div className="mt-2 space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_60px_90px] gap-2">
                      <Input
                        placeholder="Descripción"
                        value={it.description}
                        onChange={(e) => {
                          const next = [...items]; next[idx].description = e.target.value; setItems(next);
                        }}
                      />
                      <Input
                        type="number" placeholder="Cant"
                        value={it.quantity}
                        onChange={(e) => { const n=[...items]; n[idx].quantity = e.target.value; setItems(n); }}
                        className="font-mono"
                      />
                      <Input
                        type="number" placeholder="P.U."
                        value={it.unit_price}
                        onChange={(e) => { const n=[...items]; n[idx].unit_price = e.target.value; setItems(n); }}
                        className="font-mono"
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", quantity: "1", unit_price: "0" }])} className="w-full">
                    <Plus className="h-3 w-3 mr-1.5" /> Agregar concepto
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA 16%</span><span>{fmtMoney(tax)}</span></div>
                <div className="flex justify-between pt-1 mt-1 border-t border-white/[0.06] text-sm font-semibold"><span>Total</span><span>{fmtMoney(total)}</span></div>
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
                {create.isPending ? "Generando…" : "Generar cotización"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Folio</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Concepto</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Vigencia</th>
              <th className="px-4 py-3 text-left">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 font-mono text-xs">{q.folio}</td>
                <td className="px-4 py-3">{q.client?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{q.title ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{fmtMoney(Number(q.total))}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{q.valid_until ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded border font-mono text-[10px] uppercase tracking-wider ${statusColor[q.status]}`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Sin cotizaciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============== ACTIVITIES ============== */
type Activity = Database["public"]["Tables"]["activities"]["Row"];

function ActivitiesTab({ orgId }: { orgId: string | null | undefined }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Database["public"]["Enums"]["activity_type"]>("nota");
  const [description, setDescription] = useState("");

  const { data: activities = [] } = useQuery({
    queryKey: ["crm", "activities", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as Activity[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { error } = await supabase.from("activities").insert({
        organization_id: orgId, title, type, description: description || null,
        owner_id: user?.id ?? null, created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm", "activities"] });
      toast.success("Actividad registrada");
      setTitle(""); setDescription(""); setType("nota");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("activities").update({ completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm", "activities"] }),
  });

  const typeColor: Record<string, string> = {
    llamada: "text-blue-300",
    correo: "text-purple-300",
    reunion: "text-emerald-300",
    nota: "text-muted-foreground",
    tarea: "text-amber-300",
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4">
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.04]">
        {activities.map((a) => (
          <div key={a.id} className="p-4 flex items-start gap-3 hover:bg-white/[0.02]">
            <button
              onClick={() => toggle.mutate({ id: a.id, completed: !a.completed })}
              className={`h-5 w-5 rounded border ${a.completed ? "bg-primary border-primary" : "border-white/20"} flex items-center justify-center shrink-0 mt-0.5`}
            >
              {a.completed && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[10px] uppercase tracking-[0.15em] ${typeColor[a.type]}`}>{a.type}</span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {new Date(a.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div className={`text-sm mt-0.5 ${a.completed ? "line-through text-muted-foreground" : ""}`}>{a.title}</div>
              {a.description && <div className="text-xs text-muted-foreground mt-1">{a.description}</div>}
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">Sin actividades</div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 h-fit">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Registrar actividad</h3>
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="llamada">Llamada</SelectItem>
              <SelectItem value="correo">Correo</SelectItem>
              <SelectItem value="reunion">Reunión</SelectItem>
              <SelectItem value="nota">Nota</SelectItem>
              <SelectItem value="tarea">Tarea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Descripción</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5" rows={3} />
        </div>
        <Button onClick={() => create.mutate()} disabled={!title || create.isPending} className="w-full">
          <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
          {create.isPending ? "Registrando…" : "Registrar"}
        </Button>
      </div>
    </div>
  );
}
