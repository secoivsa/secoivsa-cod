import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Download, Briefcase, ShieldCheck, HardHat, DollarSign, Factory, Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/_authenticated/nexus/reports")({
  component: ReportsPage,
});

type ReportKey = "projects" | "quality" | "safety" | "finance" | "production";

const REPORTS: { key: ReportKey; label: string; desc: string; icon: any; color: string }[] = [
  { key: "projects", label: "Avance de proyectos", desc: "Estado, % avance, presupuesto", icon: Briefcase, color: "text-primary" },
  { key: "production", label: "Productividad operativa", desc: "Avances reportados, horas, personal", icon: Factory, color: "text-emerald-400" },
  { key: "quality", label: "Calidad", desc: "Inspecciones, no conformidades, acciones", icon: ShieldCheck, color: "text-cyan-400" },
  { key: "safety", label: "Seguridad industrial", desc: "Permisos, incidentes, severidad", icon: HardHat, color: "text-amber-400" },
  { key: "finance", label: "Finanzas", desc: "Presupuestos, gastos, flujo", icon: DollarSign, color: "text-violet-400" },
];

function ReportsPage() {
  const [busy, setBusy] = useState<ReportKey | null>(null);

  const { data: org } = useQuery({
    queryKey: ["report-org"],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("name, legal_name, rfc").limit(1).maybeSingle();
      return data;
    },
  });

  async function generate(key: ReportKey) {
    setBusy(key);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(5, 7, 10);
      doc.rect(0, 0, pageW, 70, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("NEXUS OS · Reporte ejecutivo", 40, 32);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(org?.name ?? "SECOIVSA", 40, 50);
      doc.text(new Date().toLocaleString("es-MX"), pageW - 40, 50, { align: "right" });

      doc.setTextColor(20, 20, 20);
      const meta = REPORTS.find((r) => r.key === key)!;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(meta.label, 40, 110);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(meta.desc, 40, 128);

      let head: string[] = [];
      let body: (string | number)[][] = [];

      if (key === "projects") {
        const { data } = await supabase
          .from("projects")
          .select("code, name, status, progress_pct, budget, start_date, end_date")
          .order("created_at", { ascending: false });
        head = ["Código", "Proyecto", "Estado", "% Avance", "Presupuesto"];
        body = (data ?? []).map((p: any) => [
          p.code ?? "—", p.name, p.status, `${Number(p.progress_pct ?? 0)}%`,
          new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(p.budget ?? 0)),
        ]);
      } else if (key === "production") {
        const { data } = await supabase
          .from("progress_entries")
          .select("reported_at, title, progress_pct, hours, personnel_count, status")
          .order("reported_at", { ascending: false })
          .limit(200);
        head = ["Fecha", "Concepto", "% Avance", "Horas", "Personal", "Estado"];
        body = (data ?? []).map((r: any) => [
          r.reported_at, r.title, `${r.progress_pct}%`, r.hours, r.personnel_count, r.status,
        ]);
      } else if (key === "quality") {
        const [insp, nc] = await Promise.all([
          supabase.from("inspections").select("folio, title, status, scheduled_date, performed_date").order("created_at", { ascending: false }).limit(150),
          supabase.from("non_conformities").select("folio, title, severity, status, detected_at").order("created_at", { ascending: false }).limit(150),
        ]);
        head = ["Folio", "Tipo", "Título", "Estado", "Fecha"];
        body = [
          ...(insp.data ?? []).map((r: any) => [r.folio ?? "—", "Inspección", r.title, r.status, r.performed_date ?? r.scheduled_date ?? "—"]),
          ...(nc.data ?? []).map((r: any) => [r.folio ?? "—", `NC ${r.severity}`, r.title, r.status, r.detected_at]),
        ];
      } else if (key === "safety") {
        const [perm, inc] = await Promise.all([
          supabase.from("work_permits").select("folio, permit_type, status, valid_from, valid_to").order("created_at", { ascending: false }).limit(150),
          supabase.from("incidents").select("folio, title, severity, status, occurred_at").order("occurred_at", { ascending: false }).limit(150),
        ]);
        head = ["Folio", "Tipo", "Concepto", "Severidad / estado", "Fecha"];
        body = [
          ...(perm.data ?? []).map((r: any) => [r.folio ?? "—", "Permiso", r.permit_type, r.status, r.valid_from ?? "—"]),
          ...(inc.data ?? []).map((r: any) => [r.folio ?? "—", "Incidente", r.title, `${r.severity} / ${r.status}`, r.occurred_at]),
        ];
      } else if (key === "finance") {
        const [exp, cash] = await Promise.all([
          supabase.from("expenses").select("expense_date, vendor, description, category, amount, status").order("expense_date", { ascending: false }).limit(200),
          supabase.from("cash_movements").select("movement_date, movement_type, description, amount").order("movement_date", { ascending: false }).limit(200),
        ]);
        const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
        head = ["Fecha", "Tipo", "Concepto", "Categoría", "Monto"];
        body = [
          ...(exp.data ?? []).map((r: any) => [r.expense_date, "Gasto", `${r.vendor ?? ""} — ${r.description}`, r.category, fmt(Number(r.amount))]),
          ...(cash.data ?? []).map((r: any) => [r.movement_date, r.movement_type, r.description, "—", fmt(Number(r.amount))]),
        ];
      }

      autoTable(doc, {
        head: [head],
        body,
        startY: 150,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [16, 22, 32], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 40, right: 40 },
      });

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`NEXUS OS · ${meta.label} · pág ${i}/${pages}`, pageW / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
      }

      doc.save(`NEXUS_${key}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.3em] uppercase text-muted-foreground mb-2">
          <FileText className="h-3 w-3 text-primary" /> Report Center
        </div>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          Centro de reportes ejecutivos
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Genere reportes PDF profesionales con datos en tiempo real, listos para dirección y stakeholders.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition flex flex-col">
            <div className={`h-10 w-10 rounded-md bg-primary/10 grid place-items-center mb-4 ${r.color}`}>
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{r.label}</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4 flex-1">{r.desc}</p>
            <button
              onClick={() => generate(r.key)}
              disabled={busy === r.key}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary/15 hover:bg-primary/25 text-primary text-[11px] font-mono tracking-[0.2em] uppercase transition disabled:opacity-50"
            >
              {busy === r.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              {busy === r.key ? "Generando…" : "Generar PDF"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
