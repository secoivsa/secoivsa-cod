import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

// ============================================================
// LIVE OPERATIONS KPIs
// ============================================================
export const getOpsLiveDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = context.supabase;
    const today = new Date().toISOString().slice(0, 10);

    const [
      projects,
      progressToday,
      attendanceToday,
      incidentsOpen,
      permitsActive,
      alertsCritical,
      evidencesToday,
      materialsLow,
      expensesMonth,
    ] = await Promise.all([
      sb.from("projects").select("id,name,status,progress_pct,budget,client_id,updated_at").in("status", ["planeacion", "en_curso", "pausado"] as never).order("updated_at", { ascending: false }).limit(50),
      sb.from("progress_entries").select("id,project_id,title,progress_pct,personnel_count,hours,reported_at").eq("reported_at", today),
      sb.from("attendance").select("id,project_id,employee_id,status").eq("date", today),
      sb.from("incidents").select("id,title,severity,project_id,occurred_at,status").not("status", "in", "(cerrado,cancelado)" as never).order("occurred_at", { ascending: false }).limit(20),
      sb.from("work_permits").select("id,folio,permit_type,project_id,status,valid_until").in("status", ["aprobado", "activo"] as never).limit(20),
      sb.from("alerts").select("id,title,severity,source,created_at,link").eq("severity", "critical" as never).order("created_at", { ascending: false }).limit(10),
      sb.from("evidences").select("id,project_id,kind,title,file_url,created_at").gte("created_at", `${today}T00:00:00Z`).order("created_at", { ascending: false }).limit(20),
      sb.from("materials").select("id,name,stock,min_stock,unit").lte("stock", 1000).limit(50),
      sb.from("expenses").select("amount,project_id,expense_date").gte("expense_date", today.slice(0, 8) + "01"),
    ]);

    const totalPersonnel = (attendanceToday.data ?? []).filter(a => a.status === "presente").length;
    const avgProgress = projects.data?.length
      ? Math.round((projects.data.reduce((s, p) => s + Number(p.progress_pct ?? 0), 0) / projects.data.length))
      : 0;
    const lowStockCount = (materialsLow.data ?? []).filter(m => Number(m.stock) <= Number(m.min_stock ?? 0)).length;
    const monthSpend = (expensesMonth.data ?? []).reduce((s, e) => s + Number(e.amount ?? 0), 0);

    return {
      kpis: {
        activeProjects: projects.data?.length ?? 0,
        personnelOnSite: totalPersonnel,
        avgProgress,
        criticalAlerts: alertsCritical.data?.length ?? 0,
        openIncidents: incidentsOpen.data?.length ?? 0,
        activePermits: permitsActive.data?.length ?? 0,
        evidencesToday: evidencesToday.data?.length ?? 0,
        progressEntriesToday: progressToday.data?.length ?? 0,
        lowStockCount,
        monthSpend,
      },
      projects: projects.data ?? [],
      incidents: incidentsOpen.data ?? [],
      permits: permitsActive.data ?? [],
      alerts: alertsCritical.data ?? [],
      evidences: evidencesToday.data ?? [],
      progressToday: progressToday.data ?? [],
    };
  });

// ============================================================
// PROJECT TIMELINE (evidences + progress + incidents)
// ============================================================
export const getProjectTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string }) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [proj, evid, prog, inc, perm, team, atd] = await Promise.all([
      sb.from("projects").select("*").eq("id", data.projectId).maybeSingle(),
      sb.from("evidences").select("*").eq("project_id", data.projectId).order("created_at", { ascending: false }).limit(100),
      sb.from("progress_entries").select("*").eq("project_id", data.projectId).order("reported_at", { ascending: false }).limit(50),
      sb.from("incidents").select("*").eq("project_id", data.projectId).order("occurred_at", { ascending: false }).limit(20),
      sb.from("work_permits").select("*").eq("project_id", data.projectId).order("created_at", { ascending: false }).limit(20),
      sb.from("employee_assignments").select("id,employee_id,role_label,start_date,end_date").eq("project_id", data.projectId),
      sb.from("attendance").select("id,employee_id,date,status,hours").eq("project_id", data.projectId).gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
    ]);
    return {
      project: proj.data,
      evidences: evid.data ?? [],
      progress: prog.data ?? [],
      incidents: inc.data ?? [],
      permits: perm.data ?? [],
      team: team.data ?? [],
      attendance: atd.data ?? [],
    };
  });

// ============================================================
// QUICK SUPERVISOR CAPTURE (mobile-first)
// ============================================================
export const quickProgressReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      title: z.string().trim().min(2).max(200),
      description: z.string().trim().max(2000).optional(),
      progress_pct: z.number().min(0).max(100),
      personnel_count: z.number().int().min(0).max(2000).default(0),
      hours: z.number().min(0).max(24).default(8),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("progress_entries").insert({
      organization_id: DEFAULT_ORG,
      project_id: data.project_id,
      title: data.title,
      description: data.description ?? null,
      progress_pct: data.progress_pct,
      personnel_count: data.personnel_count,
      hours: data.hours,
      reported_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const quickEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      title: z.string().trim().max(200).optional(),
      description: z.string().trim().max(2000).optional(),
      file_url: z.string().url().max(2000),
      kind: z.enum(["foto", "video", "documento"]).default("foto"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("evidences").insert({
      organization_id: DEFAULT_ORG,
      project_id: data.project_id,
      title: data.title ?? null,
      description: data.description ?? null,
      file_url: data.file_url,
      kind: data.kind as never,
      uploaded_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const quickIncident = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      project_id: z.string().uuid(),
      title: z.string().trim().min(3).max(200),
      description: z.string().trim().max(2000).optional(),
      severity: z.enum(["leve", "moderado", "grave", "fatal"]).default("leve"),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("incidents").insert({
      organization_id: DEFAULT_ORG,
      project_id: data.project_id,
      title: data.title,
      description: data.description ?? null,
      severity: data.severity as never,
      occurred_at: new Date().toISOString(),
      reported_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listOpsProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id,name,status,progress_pct")
      .in("status", ["planeacion", "en_curso", "pausado"] as never)
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
