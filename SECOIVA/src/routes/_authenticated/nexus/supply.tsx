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
  Truck, Plus, Package, ClipboardList, Warehouse, ShoppingCart,
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Material = Database["public"]["Tables"]["materials"]["Row"];
type Requisition = Database["public"]["Tables"]["requisitions"]["Row"];
type PO = Database["public"]["Tables"]["purchase_orders"]["Row"];
type Movement = Database["public"]["Tables"]["warehouse_movements"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const REQ_STATUS = [
  { id: "borrador", label: "Borrador", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "en_revision", label: "En revisión", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "aprobada", label: "Aprobada", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "rechazada", label: "Rechazada", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "comprada", label: "Comprada", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "recibida", label: "Recibida", color: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30" },
  { id: "cerrada", label: "Cerrada", color: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
] as const;
type ReqStatus = (typeof REQ_STATUS)[number]["id"];

const PO_STATUS = [
  { id: "borrador", label: "Borrador", color: "bg-slate-500/15 text-slate-300 border-slate-400/30" },
  { id: "enviada", label: "Enviada", color: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  { id: "confirmada", label: "Confirmada", color: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30" },
  { id: "parcial", label: "Parcial", color: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  { id: "recibida", label: "Recibida", color: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  { id: "cancelada", label: "Cancelada", color: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
  { id: "cerrada", label: "Cerrada", color: "bg-zinc-500/15 text-zinc-300 border-zinc-400/30" },
] as const;
type POStatus = (typeof PO_STATUS)[number]["id"];

export const Route = createFileRoute("/_authenticated/nexus/supply")({
  component: SupplyPage,
});

function SupplyPage() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <header className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
            10 · SUPPLY · cadena de suministro
          </p>
          <h1 className="mt-2 text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Truck className="h-7 w-7 text-primary" /> Compras y almacén
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Materiales, requisiciones, órdenes de compra y movimientos de almacén — sincronizado con Projects y Production.
          </p>
        </div>
        <KpisStrip orgId={orgId} />
      </header>

      <Tabs defaultValue="requisitions" className="w-full">
        <TabsList className="bg-white/[0.03] border border-white/[0.06] p-1 h-auto">
          <TabsTrigger value="requisitions" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <ClipboardList className="h-3.5 w-3.5 mr-2" /> Requisiciones
          </TabsTrigger>
          <TabsTrigger value="pos" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Órdenes de compra
          </TabsTrigger>
          <TabsTrigger value="materials" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <Package className="h-3.5 w-3.5 mr-2" /> Materiales
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="font-mono text-[11px] tracking-[0.12em] uppercase">
            <Warehouse className="h-3.5 w-3.5 mr-2" /> Almacén
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="mt-6"><RequisitionsTab orgId={orgId} /></TabsContent>
        <TabsContent value="pos" className="mt-6"><PurchaseOrdersTab orgId={orgId} /></TabsContent>
        <TabsContent value="materials" className="mt-6"><MaterialsTab orgId={orgId} /></TabsContent>
        <TabsContent value="warehouse" className="mt-6"><WarehouseTab orgId={orgId} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============== KPIs ============== */
function KpisStrip({ orgId }: { orgId?: string | null }) {
  const { data } = useQuery({
    queryKey: ["supply", "kpis", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ count: openReqs }, { count: openPOs }, { data: mats }] = await Promise.all([
        supabase.from("requisitions").select("id", { count: "exact", head: true }).in("status", ["borrador", "en_revision", "aprobada"]),
        supabase.from("purchase_orders").select("id", { count: "exact", head: true }).in("status", ["borrador", "enviada", "confirmada", "parcial"]),
        supabase.from("materials").select("id,stock,min_stock"),
      ]);
      const lowStock = (mats ?? []).filter((m) => Number(m.stock) <= Number(m.min_stock) && Number(m.min_stock) > 0).length;
      return { openReqs: openReqs ?? 0, openPOs: openPOs ?? 0, lowStock, materials: mats?.length ?? 0 };
    },
  });
  const items = [
    { label: "Requisiciones abiertas", value: data?.openReqs ?? 0 },
    { label: "OC en curso", value: data?.openPOs ?? 0 },
    { label: "Materiales", value: data?.materials ?? 0 },
    { label: "Stock bajo", value: data?.lowStock ?? 0, alert: (data?.lowStock ?? 0) > 0 },
  ];
  return (
    <div className="flex gap-2">
      {items.map((i) => (
        <div key={i.label} className={`rounded-lg border px-3 py-2 ${i.alert ? "border-amber-500/40 bg-amber-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"}`}>
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{i.label}</div>
          <div className={`text-lg font-bold font-mono ${i.alert ? "text-amber-300" : ""}`}>{i.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ============== REQUISITIONS ============== */
function RequisitionsTab({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: rows = [] } = useQuery({
    queryKey: ["supply", "requisitions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: reqs }, { data: projects }] = await Promise.all([
        supabase.from("requisitions").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("id,name,code"),
      ]);
      const pmap = new Map((projects ?? []).map((p) => [p.id, p]));
      return (reqs ?? []).map((r) => ({ ...r, project: r.project_id ? pmap.get(r.project_id) : null })) as (Requisition & { project?: Pick<Project, "id" | "name" | "code"> | null })[];
    },
  });

  const moveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReqStatus }) => {
      const patch: Partial<Requisition> = { status };
      if (status === "aprobada") patch.approved_at = new Date().toISOString();
      const { error } = await supabase.from("requisitions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("Requisición actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] h-9 font-mono text-xs uppercase tracking-wider"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estatus</SelectItem>
              {REQ_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground font-mono">{filtered.length} requisiciones</span>
        </div>
        <NewRequisitionSheet orgId={orgId} />
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Folio</th>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Proyecto</th>
              <th className="px-4 py-3 text-left">Necesario</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const st = REQ_STATUS.find((s) => s.id === r.status)!;
              return (
                <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{r.folio}</td>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.project?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{r.needed_by ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtMoney(Number(r.total))}</td>
                  <td className="px-4 py-3">
                    <Select value={r.status} onValueChange={(v) => moveStatus.mutate({ id: r.id, status: v as ReqStatus })}>
                      <SelectTrigger className={`h-7 w-[140px] text-[10px] font-mono uppercase tracking-wider ${st.color}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{REQ_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground font-mono uppercase">Sin requisiciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewRequisitionSheet({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [neededBy, setNeededBy] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ description: string; unit: string; quantity: string; unit_price: string }[]>([
    { description: "", unit: "pza", quantity: "1", unit_price: "0" },
  ]);

  const { data: projects = [] } = useQuery({
    queryKey: ["supply", "projects-mini", orgId],
    enabled: !!orgId && open,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id,name,code").order("name");
      return data ?? [];
    },
  });

  const total = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { data: req, error } = await supabase.from("requisitions").insert({
        organization_id: orgId,
        folio: "",
        title,
        project_id: projectId || null,
        needed_by: neededBy || null,
        notes: notes || null,
        total,
        requested_by: user?.id ?? null,
        created_by: user?.id ?? null,
      }).select().single();
      if (error) throw error;
      const validItems = items.filter((i) => i.description.trim());
      if (validItems.length) {
        const { error: ie } = await supabase.from("requisition_items").insert(
          validItems.map((i, idx) => ({
            requisition_id: req.id,
            description: i.description,
            unit: i.unit || "pza",
            quantity: Number(i.quantity) || 0,
            unit_price: Number(i.unit_price) || 0,
            total: Number(i.quantity) * Number(i.unit_price),
            order_idx: idx,
          }))
        );
        if (ie) throw ie;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("Requisición creada");
      setOpen(false);
      setTitle(""); setProjectId(""); setNeededBy(""); setNotes("");
      setItems([{ description: "", unit: "pza", quantity: "1", unit_price: "0" }]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva requisición
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nueva requisición</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fecha requerida</Label>
              <Input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={2} />
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Partidas</Label>
              <Button size="sm" variant="ghost" onClick={() => setItems([...items, { description: "", unit: "pza", quantity: "1", unit_price: "0" }])}>
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input placeholder="Descripción" value={it.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} className="col-span-6 text-xs" />
                  <Input placeholder="U" value={it.unit} onChange={(e) => { const n = [...items]; n[idx].unit = e.target.value; setItems(n); }} className="col-span-1 text-xs font-mono" />
                  <Input placeholder="Cant" type="number" value={it.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = e.target.value; setItems(n); }} className="col-span-2 text-xs font-mono" />
                  <Input placeholder="P.U." type="number" value={it.unit_price} onChange={(e) => { const n = [...items]; n[idx].unit_price = e.target.value; setItems(n); }} className="col-span-3 text-xs font-mono" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end text-sm font-mono">
              Total: <span className="ml-2 font-semibold">{fmtMoney(total)}</span>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending} className="w-full">
            {create.isPending ? "Creando…" : "Crear requisición"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== PURCHASE ORDERS ============== */
function PurchaseOrdersTab({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["supply", "pos", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: pos }, { data: sups }, { data: projects }] = await Promise.all([
        supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }),
        supabase.from("suppliers").select("id,name"),
        supabase.from("projects").select("id,name"),
      ]);
      const smap = new Map((sups ?? []).map((s) => [s.id, s]));
      const pmap = new Map((projects ?? []).map((p) => [p.id, p]));
      return (pos ?? []).map((p) => ({
        ...p,
        supplier: p.supplier_id ? smap.get(p.supplier_id) : null,
        project: p.project_id ? pmap.get(p.project_id) : null,
      })) as (PO & { supplier?: Pick<Supplier, "id" | "name"> | null; project?: Pick<Project, "id" | "name"> | null })[];
    },
  });

  const moveStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: POStatus }) => {
      const { error } = await supabase.from("purchase_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("OC actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{rows.length} órdenes</span>
        <NewPOSheet orgId={orgId} />
      </div>
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Folio</th>
              <th className="px-4 py-3 text-left">Proveedor</th>
              <th className="px-4 py-3 text-left">Proyecto</th>
              <th className="px-4 py-3 text-left">Esperada</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-left">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const st = PO_STATUS.find((s) => s.id === p.status)!;
              return (
                <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{p.folio}</td>
                  <td className="px-4 py-3">{p.supplier?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.project?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{p.expected_date ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtMoney(Number(p.total))}</td>
                  <td className="px-4 py-3">
                    <Select value={p.status} onValueChange={(v) => moveStatus.mutate({ id: p.id, status: v as POStatus })}>
                      <SelectTrigger className={`h-7 w-[140px] text-[10px] font-mono uppercase tracking-wider ${st.color}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{PO_STATUS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground font-mono uppercase">Sin órdenes de compra</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewPOSheet({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [requisitionId, setRequisitionId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ description: "", unit: "pza", quantity: "1", unit_price: "0" }]);

  const { data } = useQuery({
    queryKey: ["supply", "po-refs", orgId, open],
    enabled: !!orgId && open,
    queryFn: async () => {
      const [{ data: sups }, { data: prjs }, { data: reqs }] = await Promise.all([
        supabase.from("suppliers").select("id,name").order("name"),
        supabase.from("projects").select("id,name").order("name"),
        supabase.from("requisitions").select("id,folio,title").in("status", ["aprobada", "borrador", "en_revision"]).order("created_at", { ascending: false }),
      ]);
      return { sups: sups ?? [], prjs: prjs ?? [], reqs: reqs ?? [] };
    },
  });

  const subtotal = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { data: po, error } = await supabase.from("purchase_orders").insert({
        organization_id: orgId,
        folio: "",
        supplier_id: supplierId || null,
        project_id: projectId || null,
        requisition_id: requisitionId || null,
        expected_date: expected || null,
        notes: notes || null,
        subtotal, tax, total,
        created_by: user?.id ?? null,
      }).select().single();
      if (error) throw error;
      const valid = items.filter((i) => i.description.trim());
      if (valid.length) {
        const { error: ie } = await supabase.from("purchase_order_items").insert(
          valid.map((i, idx) => ({
            purchase_order_id: po.id,
            description: i.description,
            unit: i.unit || "pza",
            quantity: Number(i.quantity) || 0,
            unit_price: Number(i.unit_price) || 0,
            total: Number(i.quantity) * Number(i.unit_price),
            order_idx: idx,
          }))
        );
        if (ie) throw ie;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("OC creada");
      setOpen(false);
      setSupplierId(""); setProjectId(""); setRequisitionId(""); setExpected(""); setNotes("");
      setItems([{ description: "", unit: "pza", quantity: "1", unit_price: "0" }]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Nueva OC
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-[#06090d] border-white/10 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nueva orden de compra</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proveedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>{(data?.sups ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Sin proyecto" /></SelectTrigger>
                <SelectContent>{(data?.prjs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Requisición origen</Label>
              <Select value={requisitionId} onValueChange={setRequisitionId}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>{(data?.reqs ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.folio} · {r.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Fecha esperada</Label>
              <Input type="date" value={expected} onChange={(e) => setExpected(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={2} />
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Partidas</Label>
              <Button size="sm" variant="ghost" onClick={() => setItems([...items, { description: "", unit: "pza", quantity: "1", unit_price: "0" }])}>
                <Plus className="h-3 w-3 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2">
                  <Input placeholder="Descripción" value={it.description} onChange={(e) => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} className="col-span-6 text-xs" />
                  <Input placeholder="U" value={it.unit} onChange={(e) => { const n = [...items]; n[idx].unit = e.target.value; setItems(n); }} className="col-span-1 text-xs font-mono" />
                  <Input placeholder="Cant" type="number" value={it.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = e.target.value; setItems(n); }} className="col-span-2 text-xs font-mono" />
                  <Input placeholder="P.U." type="number" value={it.unit_price} onChange={(e) => { const n = [...items]; n[idx].unit_price = e.target.value; setItems(n); }} className="col-span-3 text-xs font-mono" />
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-xs font-mono text-right">
              <div>Subtotal: <span className="font-semibold">{fmtMoney(subtotal)}</span></div>
              <div className="text-muted-foreground">IVA 16%: {fmtMoney(tax)}</div>
              <div className="text-sm">Total: <span className="font-bold">{fmtMoney(total)}</span></div>
            </div>
          </div>
        </div>
        <SheetFooter className="mt-6">
          <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full">
            {create.isPending ? "Creando…" : "Crear OC"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ============== MATERIALS ============== */
function MaterialsTab({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", category: "", unit: "pza", unit_cost: "0", min_stock: "0" });

  const { data: mats = [] } = useQuery({
    queryKey: ["supply", "materials", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Material[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("Sin organización");
      const { error } = await supabase.from("materials").insert({
        organization_id: orgId,
        code: form.code || null,
        name: form.name,
        category: form.category || null,
        unit: form.unit,
        unit_cost: Number(form.unit_cost) || 0,
        min_stock: Number(form.min_stock) || 0,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("Material creado");
      setOpen(false);
      setForm({ code: "", name: "", category: "", unit: "pza", unit_cost: "0", min_stock: "0" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{mats.length} materiales</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo material
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#06090d] border-white/10">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Nuevo material</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              {[
                { k: "code", label: "Código" },
                { k: "name", label: "Nombre" },
                { k: "category", label: "Categoría" },
                { k: "unit", label: "Unidad" },
                { k: "unit_cost", label: "Costo unitario", type: "number" },
                { k: "min_stock", label: "Stock mínimo", type: "number" },
              ].map((f) => (
                <div key={f.k}>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                  <Input type={f.type ?? "text"} value={(form as Record<string, string>)[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="mt-1.5" />
                </div>
              ))}
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => create.mutate()} disabled={!form.name || create.isPending} className="w-full">
                {create.isPending ? "Creando…" : "Crear material"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-left">Categoría</th>
              <th className="px-4 py-3 text-left">Unidad</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Mín</th>
            </tr>
          </thead>
          <tbody>
            {mats.map((m) => {
              const low = Number(m.stock) <= Number(m.min_stock) && Number(m.min_stock) > 0;
              return (
                <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.code ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.category ?? "—"}</td>
                  <td className="px-4 py-3 text-xs font-mono">{m.unit}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmtMoney(Number(m.unit_cost))}</td>
                  <td className={`px-4 py-3 text-right font-mono ${low ? "text-amber-300" : ""}`}>
                    {low && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                    {Number(m.stock).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{Number(m.min_stock).toFixed(2)}</td>
                </tr>
              );
            })}
            {mats.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground font-mono uppercase">Sin materiales</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============== WAREHOUSE ============== */
function WarehouseTab({ orgId }: { orgId?: string | null }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"entrada" | "salida" | "ajuste">("entrada");
  const [materialId, setMaterialId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: movs = [] } = useQuery({
    queryKey: ["supply", "movements", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [{ data: rows }, { data: mats }, { data: prjs }] = await Promise.all([
        supabase.from("warehouse_movements").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("materials").select("id,name,unit"),
        supabase.from("projects").select("id,name"),
      ]);
      const mmap = new Map((mats ?? []).map((m) => [m.id, m]));
      const pmap = new Map((prjs ?? []).map((p) => [p.id, p]));
      return (rows ?? []).map((r) => ({ ...r, material: mmap.get(r.material_id), project: r.project_id ? pmap.get(r.project_id) : null })) as (Movement & { material?: { name: string; unit: string }; project?: { name: string } | null })[];
    },
  });

  const { data: refs } = useQuery({
    queryKey: ["supply", "wh-refs", orgId, open],
    enabled: !!orgId && open,
    queryFn: async () => {
      const [{ data: mats }, { data: prjs }] = await Promise.all([
        supabase.from("materials").select("id,name,unit,unit_cost").order("name"),
        supabase.from("projects").select("id,name").order("name"),
      ]);
      return { mats: mats ?? [], prjs: prjs ?? [] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!orgId || !materialId) throw new Error("Material requerido");
      const { error } = await supabase.from("warehouse_movements").insert({
        organization_id: orgId,
        material_id: materialId,
        project_id: projectId || null,
        movement_type: type,
        quantity: Number(quantity) || 0,
        unit_cost: Number(unitCost) || 0,
        notes: notes || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supply"] });
      toast.success("Movimiento registrado");
      setOpen(false);
      setMaterialId(""); setProjectId(""); setQuantity("1"); setUnitCost("0"); setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">Últimos {movs.length} movimientos</span>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="font-mono text-[11px] uppercase tracking-wider">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Nuevo movimiento
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-[#06090d] border-white/10">
            <SheetHeader>
              <SheetTitle className="font-mono text-sm tracking-[0.2em] uppercase">Movimiento de almacén</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 mt-6">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Material</Label>
                <Select value={materialId} onValueChange={(v) => {
                  setMaterialId(v);
                  const m = refs?.mats.find((x) => x.id === v);
                  if (m) setUnitCost(String(m.unit_cost));
                }}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>{(refs?.mats ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Proyecto (opcional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(refs?.prjs ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Cantidad</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1.5 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Costo unit.</Label>
                  <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="mt-1.5 font-mono" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5" rows={2} />
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button onClick={() => create.mutate()} disabled={!materialId || create.isPending} className="w-full">
                {create.isPending ? "Registrando…" : "Registrar movimiento"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] border-b border-white/[0.06]">
            <tr className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Material</th>
              <th className="px-4 py-3 text-left">Proyecto</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-left">Notas</th>
            </tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{new Date(m.created_at).toLocaleDateString("es-MX")}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${m.movement_type === "entrada" ? "border-emerald-400/30 text-emerald-300" : m.movement_type === "salida" ? "border-rose-400/30 text-rose-300" : "border-amber-400/30 text-amber-300"}`}>
                    {m.movement_type === "entrada" ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : m.movement_type === "salida" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : null}
                    {m.movement_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium">{m.material?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{m.project?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{Number(m.quantity).toFixed(2)} {m.material?.unit ?? ""}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[280px]">{m.notes ?? "—"}</td>
              </tr>
            ))}
            {movs.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground font-mono uppercase">Sin movimientos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
