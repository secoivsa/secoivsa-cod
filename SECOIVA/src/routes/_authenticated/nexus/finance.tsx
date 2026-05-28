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
  DollarSign, Plus, TrendingUp, TrendingDown, Wallet, Receipt,
  Briefcase, AlertTriangle, ArrowDownLeft, ArrowUpRight, PieChart,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type CashMovement = Database["public"]["Tables"]["cash_movements"]["Row"];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const EXPENSE_CATS = [
  "materiales", "mano_obra", "equipo", "subcontrato", "servicios",
  "transporte", "administrativo", "seguridad", "calidad", "otros",
] as const;

const EXPENSE_STATUS = [
  { id: "borrador", label: "Borrador", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "aprobado", label: "Aprobado", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "pagado", label: "Pagado", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "cancelado", label: "Cancelado", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
] as const;

export const Route = createFileRoute("/_authenticated/nexus/finance")({
  component: FinancePage,
});

function FinancePage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id ?? undefined;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            07 · FINANCE · control financiero
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-primary" /> Finanzas operativas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Presupuestos, costos reales, gastos y flujo de caja por proyecto — sincronizado con Supply y Production.
          </p>
        </div>
        <FinanceKpis orgId={orgId} />
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/[0.02] border border-white/[0.06]">
          <TabsTrigger value="overview"><PieChart className="h-3.5 w-3.5 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="expenses"><Receipt className="h-3.5 w-3.5 mr-1.5" />Gastos</TabsTrigger>
          <TabsTrigger value="budgets"><Briefcase className="h-3.5 w-3.5 mr-1.5" />Presupuestos</TabsTrigger>
          <TabsTrigger value="cashflow"><Wallet className="h-3.5 w-3.5 mr-1.5" />Flujo de caja</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6"><OverviewTab orgId={orgId} /></TabsContent>
        <TabsContent value="expenses" className="mt-6"><ExpensesTab orgId={orgId} /></TabsContent>
        <TabsContent value="budgets" className="mt-6"><BudgetsTab orgId={orgId} /></TabsContent>
        <TabsContent value="cashflow" className="mt-6"><CashFlowTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============================ KPI STRIP ============================
function FinanceKpis({ orgId }: { orgId?: string }) {
  const { data } = useQuery({
    queryKey: ["finance", "kpis", orgId],
    enabled: !!orgId,
    refetchInterval: 30000,
    queryFn: async () => {
      const [proj, bud, exp, po, cash] = await Promise.all([
        supabase.from("projects").select("budget"),
        supabase.from("budgets").select("total_amount, approved"),
        supabase.from("expenses").select("amount, status"),
        supabase.from("purchase_orders").select("total, status"),
        supabase.from("cash_movements").select("amount, movement_type"),
      ]);
      const presupuestoProyectos = (proj.data ?? []).reduce((s, p: any) => s + Number(p.budget ?? 0), 0);
      const presupuestosDetallados = (bud.data ?? []).reduce((s, b: any) => s + Number(b.total_amount ?? 0), 0);
      const gastoReal = (exp.data ?? [])
        .filter((e: any) => e.status === "aprobado" || e.status === "pagado")
        .reduce((s, e: any) => s + Number(e.amount ?? 0), 0);
      const comprasComprometidas = (po.data ?? [])
        .filter((p: any) => !["cancelada", "cerrada"].includes(p.status))
        .reduce((s, p: any) => s + Number(p.total ?? 0), 0);
      const ingresos = (cash.data ?? []).filter((c: any) => c.movement_type === "ingreso").reduce((s, c: any) => s + Number(c.amount), 0);
      const egresos = (cash.data ?? []).filter((c: any) => c.movement_type === "egreso").reduce((s, c: any) => s + Number(c.amount), 0);
      const presupuestoTotal = presupuestosDetallados || presupuestoProyectos;
      return {
        presupuestoTotal,
        gastoReal,
        comprasComprometidas,
        utilidadEstimada: presupuestoTotal - gastoReal - comprasComprometidas,
        flujo: ingresos - egresos,
      };
    },
  });

  const kpis = [
    { label: "Presupuesto", value: fmtMoney(data?.presupuestoTotal ?? 0), icon: Briefcase },
    { label: "Gasto real", value: fmtMoney(data?.gastoReal ?? 0), icon: TrendingDown },
    { label: "Comprometido", value: fmtMoney(data?.comprasComprometidas ?? 0), icon: Receipt },
    { label: "Utilidad estimada", value: fmtMoney(data?.utilidadEstimada ?? 0), icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <k.icon className="h-3 w-3 text-primary" />{k.label}
          </div>
          <div className="mt-1 text-sm font-bold font-mono">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

// ============================ OVERVIEW ============================
function OverviewTab({ orgId }: { orgId?: string }) {
  const { data } = useQuery({
    queryKey: ["finance", "overview", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [projects, expenses, budgets, pos] = await Promise.all([
        supabase.from("projects").select("id, name, code, status, budget, progress_pct"),
        supabase.from("expenses").select("project_id, amount, status, category"),
        supabase.from("budgets").select("project_id, total_amount"),
        supabase.from("purchase_orders").select("project_id, total, status"),
      ]);
      const projs = (projects.data ?? []) as Project[];
      const expArr = (expenses.data ?? []) as Expense[];
      const budArr = (budgets.data ?? []) as Budget[];
      const poArr = (pos.data ?? []) as any[];

      const byProject = projs.map((p) => {
        const bud = budArr.filter((b) => b.project_id === p.id).reduce((s, b) => s + Number(b.total_amount), 0);
        const planned = bud || Number(p.budget ?? 0);
        const spent = expArr
          .filter((e) => e.project_id === p.id && ["aprobado", "pagado"].includes(e.status))
          .reduce((s, e) => s + Number(e.amount), 0);
        const committed = poArr
          .filter((o) => o.project_id === p.id && !["cancelada", "cerrada"].includes(o.status))
          .reduce((s, o) => s + Number(o.total), 0);
        return { ...p, planned, spent, committed, available: planned - spent - committed };
      });

      // Costs by category
      const byCategory: Record<string, number> = {};
      expArr.filter((e) => ["aprobado", "pagado"].includes(e.status)).forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
      });
      const cats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      const maxCat = Math.max(1, ...cats.map((c) => c[1]));

      return { byProject, cats, maxCat };
    },
  });

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Control financiero por proyecto
        </h3>
        <div className="space-y-3">
          {(data?.byProject ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono text-center py-8">Sin proyectos registrados.</p>
          ) : (
            data?.byProject.map((p) => {
              const consumedPct = p.planned > 0 ? Math.min(100, ((p.spent + p.committed) / p.planned) * 100) : 0;
              const over = p.available < 0;
              return (
                <div key={p.id} className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{p.code ?? "—"}</div>
                      <div className="text-sm font-medium truncate">{p.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-muted-foreground">Disponible</div>
                      <div className={`text-sm font-bold font-mono ${over ? "text-red-400" : "text-emerald-300"}`}>
                        {fmtMoney(p.available)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[10px] font-mono mb-2">
                    <div><span className="text-muted-foreground">PLAN</span> <span className="text-foreground">{fmtMoney(p.planned)}</span></div>
                    <div><span className="text-muted-foreground">GASTO</span> <span className="text-foreground">{fmtMoney(p.spent)}</span></div>
                    <div><span className="text-muted-foreground">COMPR</span> <span className="text-foreground">{fmtMoney(p.committed)}</span></div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? "bg-red-400" : consumedPct > 80 ? "bg-amber-400" : "bg-primary"}`}
                      style={{ width: `${consumedPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Gasto por categoría
        </h3>
        {(data?.cats ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-8">Sin gastos registrados.</p>
        ) : (
          <ul className="space-y-3">
            {data?.cats.map(([cat, amt]) => (
              <li key={cat}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize">{cat.replace("_", " ")}</span>
                  <span className="font-mono text-muted-foreground">{fmtMoney(amt)}</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(amt / data.maxCat) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================ EXPENSES ============================
function ExpensesTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ["finance", "expenses", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false }).limit(100);
      return (data ?? []) as Expense[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["finance", "projects-lite", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, code");
      return (data ?? []) as Pick<Project, "id" | "name" | "code">[];
    },
  });

  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Gastos operativos · {expenses.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nuevo gasto</Button>
          </SheetTrigger>
          <ExpenseSheet
            projects={projects}
            orgId={orgId}
            onSaved={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["finance"] }); }}
          />
        </Sheet>
      </div>
      {expenses.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin gastos registrados.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {expenses.map((e) => {
            const status = EXPENSE_STATUS.find((s) => s.id === e.status);
            const proj = e.project_id ? projectMap[e.project_id] : null;
            return (
              <div key={e.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <div className="h-9 w-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground capitalize">{e.category.replace("_", " ")}</span>
                    {status && (
                      <span className={`text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="text-sm truncate">{e.description}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{new Date(e.expense_date).toLocaleDateString("es-MX")}</span>
                    {proj && <span>· {proj.code ?? proj.name}</span>}
                    {e.vendor && <span>· {e.vendor}</span>}
                    {e.invoice_number && <span>· F:{e.invoice_number}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{fmtMoney(Number(e.amount))}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpenseSheet({ projects, orgId, onSaved }: { projects: any[]; orgId?: string; onSaved: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    description: "", amount: "", category: "materiales", project_id: "",
    vendor: "", invoice_number: "", expense_date: new Date().toISOString().slice(0, 10),
    status: "borrador" as Expense["status"], notes: "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.description || !form.amount) throw new Error("Descripción y monto son requeridos");
      const { error } = await supabase.from("expenses").insert({
        organization_id: orgId,
        description: form.description,
        amount: Number(form.amount),
        category: form.category as any,
        project_id: form.project_id || null,
        vendor: form.vendor || null,
        invoice_number: form.invoice_number || null,
        expense_date: form.expense_date,
        status: form.status,
        notes: form.notes || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Gasto registrado"); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
      <SheetHeader><SheetTitle>Nuevo gasto</SheetTitle></SheetHeader>
      <div className="space-y-4 mt-6">
        <div>
          <Label>Descripción</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Monto</Label>
            <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_CATS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXPENSE_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Proyecto (opcional)</Label>
          <Select value={form.project_id || "none"} onValueChange={(v) => setForm({ ...form, project_id: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Sin proyecto —</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Proveedor</Label>
            <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          </div>
          <div>
            <Label>Folio factura</Label>
            <Input value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Notas</Label>
          <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <SheetFooter className="mt-6">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar gasto</Button>
      </SheetFooter>
    </SheetContent>
  );
}

// ============================ BUDGETS ============================
function BudgetsTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();

  const { data: budgets = [] } = useQuery({
    queryKey: ["finance", "budgets", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("budgets").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Budget[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["finance", "projects-for-budget"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, code");
      return data ?? [];
    },
  });

  const projectMap = useMemo(() => Object.fromEntries(projects.map((p: any) => [p.id, p])), [projects]);

  const [form, setForm] = useState({ project_id: "", total_amount: "", version: "v1", notes: "" });

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.project_id || !form.total_amount) throw new Error("Proyecto y monto son requeridos");
      const { error } = await supabase.from("budgets").insert({
        organization_id: orgId,
        project_id: form.project_id,
        total_amount: Number(form.total_amount),
        version: form.version,
        notes: form.notes || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Presupuesto creado"); setOpen(false); qc.invalidateQueries({ queryKey: ["finance"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          Presupuestos por proyecto · {budgets.length}
        </h3>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nuevo presupuesto</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
            <SheetHeader><SheetTitle>Nuevo presupuesto</SheetTitle></SheetHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label>Proyecto</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona proyecto" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.code ? `${p.code} · ` : ""}{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Monto total</Label>
                  <Input type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
                </div>
                <div>
                  <Label>Versión</Label>
                  <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      {budgets.length === 0 ? (
        <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin presupuestos creados.</p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {budgets.map((b) => {
            const proj = projectMap[b.project_id];
            return (
              <div key={b.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                <div className="h-9 w-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{b.version}</span>
                    {b.approved && (
                      <span className="text-[9px] font-mono uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border bg-emerald-500/15 text-emerald-300 border-emerald-400/30">Aprobado</span>
                    )}
                  </div>
                  <div className="text-sm truncate">{proj?.code ? `${proj.code} · ` : ""}{proj?.name ?? "Proyecto"}</div>
                  {b.notes && <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{b.notes}</div>}
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{fmtMoney(Number(b.total_amount))}</div>
                  <div className="text-[10px] font-mono text-muted-foreground">{new Date(b.created_at).toLocaleDateString("es-MX")}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================ CASH FLOW ============================
function CashFlowTab({ orgId }: { orgId?: string }) {
  const qc = useQueryClient();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    movement_type: "egreso" as CashMovement["movement_type"],
    description: "", amount: "", category: "",
    movement_date: new Date().toISOString().slice(0, 10),
    project_id: "", reference: "",
  });

  const { data: cash = [] } = useQuery({
    queryKey: ["finance", "cash", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase.from("cash_movements").select("*").order("movement_date", { ascending: false }).limit(100);
      return (data ?? []) as CashMovement[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["finance", "projects-for-cash"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name, code");
      return data ?? [];
    },
  });
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p: any) => [p.id, p])), [projects]);

  const totals = useMemo(() => {
    const ing = cash.filter((c) => c.movement_type === "ingreso").reduce((s, c) => s + Number(c.amount), 0);
    const egr = cash.filter((c) => c.movement_type === "egreso").reduce((s, c) => s + Number(c.amount), 0);
    return { ingresos: ing, egresos: egr, neto: ing - egr };
  }, [cash]);

  const save = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      if (!form.description || !form.amount) throw new Error("Descripción y monto son requeridos");
      const { error } = await supabase.from("cash_movements").insert({
        organization_id: orgId,
        movement_type: form.movement_type,
        description: form.description,
        amount: Number(form.amount),
        category: form.category || null,
        movement_date: form.movement_date,
        project_id: form.project_id || null,
        reference: form.reference || null,
        created_by: profile?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Movimiento registrado"); setOpen(false); qc.invalidateQueries({ queryKey: ["finance"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
            <ArrowDownLeft className="h-3 w-3" /> Ingresos
          </div>
          <div className="mt-2 text-xl font-bold font-mono">{fmtMoney(totals.ingresos)}</div>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-red-300">
            <ArrowUpRight className="h-3 w-3" /> Egresos
          </div>
          <div className="mt-2 text-xl font-bold font-mono">{fmtMoney(totals.egresos)}</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-primary">
            <Wallet className="h-3 w-3" /> Flujo neto
          </div>
          <div className={`mt-2 text-xl font-bold font-mono ${totals.neto < 0 ? "text-red-300" : ""}`}>{fmtMoney(totals.neto)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Movimientos · {cash.length}
          </h3>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nuevo movimiento</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg bg-[#0a0d12] border-l border-white/[0.08]">
              <SheetHeader><SheetTitle>Nuevo movimiento</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.movement_type} onValueChange={(v) => setForm({ ...form, movement_type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso</SelectItem>
                      <SelectItem value="egreso">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Monto</Label>
                    <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Input type="date" value={form.movement_date} onChange={(e) => setForm({ ...form, movement_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoría</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div>
                    <Label>Referencia</Label>
                    <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
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
              </div>
              <SheetFooter className="mt-6">
                <Button onClick={() => save.mutate()} disabled={save.isPending}>Guardar</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
        {cash.length === 0 ? (
          <p className="text-sm text-muted-foreground font-mono text-center py-12">Sin movimientos registrados.</p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {cash.map((c) => {
              const ing = c.movement_type === "ingreso";
              const proj = c.project_id ? projectMap[c.project_id] : null;
              return (
                <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition">
                  <div className={`h-9 w-9 rounded-md flex items-center justify-center border ${ing ? "bg-emerald-500/[0.04] border-emerald-500/20 text-emerald-300" : "bg-red-500/[0.04] border-red-500/20 text-red-300"}`}>
                    {ing ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{c.description}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {new Date(c.movement_date).toLocaleDateString("es-MX")}
                      {c.category && ` · ${c.category}`}
                      {proj && ` · ${proj.code ?? proj.name}`}
                      {c.reference && ` · ${c.reference}`}
                    </div>
                  </div>
                  <div className={`font-mono font-bold ${ing ? "text-emerald-300" : "text-red-300"}`}>
                    {ing ? "+" : "−"} {fmtMoney(Number(c.amount))}
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
