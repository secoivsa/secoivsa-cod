import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type InsightsSnapshot = {
  projects: { total: number; activos: number; avg_pct: number; budget_total: number };
  alerts: { activas: number; criticas: number };
  approvals_pendientes: number;
  inspections_rechazadas: number;
  incidents_mayores: number;
  materials_bajo_stock: number;
  productividad_hrs_30d: number;
  empleados_activos: number;
  oportunidades_abiertas: number;
  oportunidades_valor: number;
};

export const generateExecutiveInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ insights: string; snapshot: InsightsSnapshot }> => {
    const { supabase } = context;
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [
      projects, alerts, approvals, inspections, incidents,
      materials, progress, employees, opps,
    ] = await Promise.all([
      supabase.from("projects").select("id, status, progress_pct, budget"),
      supabase.from("alerts").select("id, severity, status").eq("status", "activa"),
      supabase.from("approvals").select("id").eq("status", "pendiente"),
      supabase.from("inspections").select("id, status").eq("status", "rechazada"),
      supabase.from("incidents").select("id, severity").in("severity", ["fatal", "grave"]),
      supabase.from("materials").select("id, stock, min_stock"),
      supabase.from("progress_entries").select("hours, reported_at").gte("reported_at", since.split("T")[0]),
      supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "activo"),
      supabase.from("opportunities").select("id, stage, value").not("stage", "in", "(perdido,aprobado)"),
    ]);

    const projs = projects.data ?? [];
    const lowStock = (materials.data ?? []).filter(
      (m: any) => m.min_stock > 0 && Number(m.stock) <= Number(m.min_stock),
    ).length;

    const snapshot: InsightsSnapshot = {
      projects: {
        total: projs.length,
        activos: projs.filter((p: any) => ["en_curso", "planeacion"].includes(p.status)).length,
        avg_pct: projs.length
          ? Math.round(projs.reduce((s: number, p: any) => s + Number(p.progress_pct ?? 0), 0) / projs.length)
          : 0,
        budget_total: projs.reduce((s: number, p: any) => s + Number(p.budget ?? 0), 0),
      },
      alerts: {
        activas: (alerts.data ?? []).length,
        criticas: (alerts.data ?? []).filter((a: any) => a.severity === "critical").length,
      },
      approvals_pendientes: (approvals.data ?? []).length,
      inspections_rechazadas: (inspections.data ?? []).length,
      incidents_mayores: (incidents.data ?? []).length,
      materials_bajo_stock: lowStock,
      productividad_hrs_30d: (progress.data ?? []).reduce((s: number, p: any) => s + Number(p.hours ?? 0), 0),
      empleados_activos: employees.count ?? 0,
      oportunidades_abiertas: (opps.data ?? []).length,
      oportunidades_valor: (opps.data ?? []).reduce((s: number, o: any) => s + Number(o.value ?? 0), 0),
    };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { snapshot, insights: "Motor IA no configurado. Configure LOVABLE_API_KEY." };
    }

    const prompt = `Eres un asesor ejecutivo de operación industrial. Analiza este snapshot operativo de SECOIVSA (construcción / energía / industrial) y entrega un informe BREVE en español, formato markdown, con estas secciones:

## Diagnóstico (2-3 líneas)
## Riesgos críticos (lista, máx 4)
## Oportunidades operativas (lista, máx 3)
## Acciones recomendadas (lista priorizada, máx 5, accionables hoy)

Datos:
${JSON.stringify(snapshot, null, 2)}

Tono: directo, sin relleno, orientado a decisión ejecutiva. Cita números clave.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Eres un copiloto ejecutivo industrial. Responde conciso y accionable." },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        return { snapshot, insights: `No se pudo generar el análisis (${res.status}). ${txt.slice(0, 200)}` };
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "Sin respuesta del modelo.";
      return { snapshot, insights: text };
    } catch (e: any) {
      return { snapshot, insights: `Error contactando al motor IA: ${e?.message ?? "desconocido"}` };
    }
  });
