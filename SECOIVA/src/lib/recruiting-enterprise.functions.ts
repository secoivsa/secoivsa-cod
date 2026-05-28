import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";
const PhoneSchema = z.string().trim().min(8).max(20).regex(/^[+\d\s().-]+$/);

// ============================================================
// AUDIT LOG (enterprise auditable)
// ============================================================
async function audit(opts: {
  actor_id?: string | null;
  actor_name?: string | null;
  action: string;
  entity_table?: string;
  entity_id?: string;
  payload?: Record<string, unknown>;
  org?: string;
}) {
  await supabaseAdmin.from("hr_audit_logs").insert({
    organization_id: opts.org ?? DEFAULT_ORG,
    actor_id: opts.actor_id ?? null,
    actor_name: opts.actor_name ?? null,
    action: opts.action,
    entity_table: opts.entity_table ?? null,
    entity_id: opts.entity_id ?? null,
    payload: (opts.payload ?? {}) as never,
  });
}

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("hr_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { logs: data ?? [] };
  });

// ============================================================
// INTERVIEWS
// ============================================================
const InterviewInput = z.object({
  candidate_id: z.string().uuid(),
  scheduled_at: z.string().datetime({ offset: true }).or(z.string().min(10)),
  duration_min: z.number().int().min(10).max(480).default(30),
  mode: z.enum(["presencial", "telefonica", "videollamada"]).default("presencial"),
  location: z.string().trim().max(300).optional(),
  interviewer_name: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const scheduleInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InterviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("interviews")
      .insert({
        candidate_id: data.candidate_id,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        duration_min: data.duration_min,
        mode: data.mode,
        location: data.location ?? null,
        interviewer_id: userId,
        interviewer_name: data.interviewer_name ?? null,
        notes: data.notes ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Cambia status del candidato a entrevista
    await supabase.from("candidates").update({ status: "entrevista" }).eq("id", data.candidate_id);

    await supabase.from("candidate_timeline").insert({
      candidate_id: data.candidate_id,
      event_type: "interview.scheduled",
      title: "Entrevista agendada",
      description: `${data.mode} · ${new Date(data.scheduled_at).toLocaleString("es-MX")}${data.location ? ` · ${data.location}` : ""}`,
      actor_id: userId,
    });

    // Confirmación automática WhatsApp
    try {
      const { data: cand } = await supabase
        .from("candidates")
        .select("phone, full_name")
        .eq("id", data.candidate_id)
        .maybeSingle();
      if (cand?.phone) {
        const dateStr = new Date(data.scheduled_at).toLocaleString("es-MX", {
          dateStyle: "full", timeStyle: "short",
        });
        const body =
          `Hola ${cand.full_name?.split(" ")[0] ?? ""} 👋\n\n` +
          `Tu entrevista en *SECOIVSA* quedó agendada:\n` +
          `📅 ${dateStr}\n` +
          `📍 ${data.mode === "presencial" ? (data.location ?? "Oficinas SECOIVSA") : data.mode}\n` +
          `⏱ Duración aprox. ${data.duration_min} min\n\n` +
          `Por favor responde *CONFIRMO* para confirmar tu asistencia.\n` +
          `Cualquier duda, escríbenos. Gracias.`;
        const { getWhatsAppProvider } = await import("./whatsapp/provider");
        const sent = await getWhatsAppProvider().send({ to: cand.phone, body });
        await supabase.from("candidate_messages").insert({
          candidate_id: data.candidate_id,
          direction: "out",
          channel: "whatsapp",
          body,
          provider_message_id: sent.providerMessageId,
          metadata: { auto: true, kind: "interview_confirmation" },
        });
        await supabase.from("interviews").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", row.id);
      }
    } catch (e) {
      console.error("[interview] confirmation send failed:", e);
    }

    await audit({
      actor_id: userId, action: "interview.scheduled",
      entity_table: "interviews", entity_id: row.id,
      payload: { candidate_id: data.candidate_id, scheduled_at: data.scheduled_at, mode: data.mode },
    });

    return { ok: true, interview: row };
  });

export const listInterviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase
      .from("interviews")
      .select("*, candidate:candidates(id, full_name, phone, position, category, ai_score)")
      .order("scheduled_at", { ascending: true });
    if (data.from) q = q.gte("scheduled_at", data.from);
    if (data.to) q = q.lte("scheduled_at", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { interviews: rows ?? [] };
  });

export const updateInterviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["programada","confirmada","reprogramada","completada","no_show","cancelada"]),
      note: z.string().trim().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch = { status: data.status, ...(data.status === "confirmada" ? { confirmed_at: new Date().toISOString() } : {}) };
    const { data: row, error } = await supabase
      .from("interviews").update(patch).eq("id", data.id).select("candidate_id").single();
    if (error) throw new Error(error.message);
    await supabase.from("candidate_timeline").insert({
      candidate_id: row.candidate_id,
      event_type: `interview.${data.status}`,
      title: `Entrevista: ${data.status}`,
      description: data.note ?? null,
      actor_id: userId,
    });
    await audit({ actor_id: userId, action: `interview.${data.status}`, entity_table: "interviews", entity_id: data.id });
    return { ok: true };
  });

// ============================================================
// BLACKLIST
// ============================================================
export const listBlacklist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidate_blacklist").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { blacklist: data ?? [] };
  });

export const addToBlacklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      phone: PhoneSchema,
      full_name: z.string().trim().max(120).optional(),
      reason: z.string().trim().min(2).max(500),
      severity: z.enum(["baja","media","alta"]).default("media"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const phone = data.phone.replace(/\D/g, "");
    const { error } = await supabase.from("candidate_blacklist").upsert({
      phone,
      full_name: data.full_name ?? null,
      reason: data.reason,
      severity: data.severity,
      added_by: userId,
    }, { onConflict: "organization_id,phone" });
    if (error) throw new Error(error.message);
    // Marca candidatos existentes como descartado
    await supabase.from("candidates").update({ status: "descartado" }).eq("phone", phone);
    await audit({ actor_id: userId, action: "blacklist.add", payload: { phone, reason: data.reason, severity: data.severity } });
    return { ok: true };
  });

export const removeFromBlacklist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("candidate_blacklist").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit({ actor_id: context.userId, action: "blacklist.remove", entity_id: data.id });
    return { ok: true };
  });

// ============================================================
// DOCUMENTS · upload + OCR + validación
// ============================================================
const REQUIRED_DOC_TYPES = ["ine", "cv", "comprobante_domicilio"] as const;
type DocType = (typeof REQUIRED_DOC_TYPES)[number] | "curp" | "rfc" | "nss" | "otro";

export const uploadCandidateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      candidate_id: z.string().uuid(),
      name: z.string().trim().min(1).max(200),
      doc_type: z.enum(["ine","cv","comprobante_domicilio","curp","rfc","nss","otro"]).default("otro"),
      mime_type: z.string().max(120).optional(),
      base64: z.string().min(20), // data sin prefijo
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const buffer = Buffer.from(data.base64, "base64");
    const ext = (data.name.split(".").pop() ?? "bin").toLowerCase().slice(0, 8);
    const path = `${data.candidate_id}/${Date.now()}-${data.doc_type}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("candidate-docs")
      .upload(path, buffer, {
        contentType: data.mime_type ?? "application/octet-stream",
        upsert: false,
      });
    if (upErr) throw new Error(upErr.message);

    const { data: doc, error } = await supabase
      .from("candidate_documents")
      .insert({
        candidate_id: data.candidate_id,
        name: data.name,
        storage_path: path,
        mime_type: data.mime_type ?? null,
        size_bytes: buffer.byteLength,
        doc_type: data.doc_type,
        uploaded_by: userId,
      })
      .select("*").single();
    if (error) throw new Error(error.message);

    await supabase.from("candidate_timeline").insert({
      candidate_id: data.candidate_id,
      event_type: "document.uploaded",
      title: `Documento: ${data.name}`,
      description: data.doc_type,
      actor_id: userId,
    });

    await audit({ actor_id: userId, action: "document.upload", entity_table: "candidate_documents", entity_id: doc.id, payload: { doc_type: data.doc_type } });

    // Disparar OCR en background (no bloqueante)
    runOCRAndValidate(doc.id).catch((e) => console.error("[ocr]", e));
    // Recalcular documentos completos
    refreshDocCompleteness(data.candidate_id).catch(() => {});

    return { ok: true, document: doc };
  });

async function runOCRAndValidate(documentId: string) {
  const { data: doc } = await supabaseAdmin
    .from("candidate_documents").select("*").eq("id", documentId).maybeSingle();
  if (!doc) return;

  const { data: signed } = await supabaseAdmin.storage
    .from("candidate-docs").createSignedUrl(doc.storage_path, 600);
  if (!signed?.signedUrl) return;

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    await supabaseAdmin.from("candidate_documents")
      .update({ validation_status: "pendiente", validation_notes: "OCR no disponible (sin LOVABLE_API_KEY)" })
      .eq("id", documentId);
    return;
  }

  // Solo imágenes y PDFs pequeños → OCR vía Gemini Vision
  const mime = doc.mime_type ?? "";
  const isImage = mime.startsWith("image/");
  if (!isImage) {
    // PDFs: marcar pendiente revisión humana
    await supabaseAdmin.from("candidate_documents")
      .update({ validation_status: "pendiente", validation_notes: "PDF · validación manual" })
      .eq("id", documentId);
    return;
  }

  try {
    const prompt = `Eres OCR experto en documentos mexicanos (INE, CV, comprobantes). Extrae todo el texto visible y entrega JSON estricto:
{"text": "...todo el texto literal...", "fields": {"nombre":"", "curp":"", "rfc":"", "fecha_nacimiento":"", "domicilio":""}, "tipo_detectado":"ine|cv|comprobante_domicilio|otro"}
Tipo declarado por el usuario: "${doc.doc_type}". Devuelve SOLO JSON.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ],
        }],
      }),
    });
    const json = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: raw, fields: {} };

    // Validación básica: ¿coincide tipo? ¿hay nombre?
    let status: "valido" | "incompleto" | "rechazado" = "valido";
    const notes: string[] = [];
    if (doc.doc_type === "ine") {
      if (!parsed.fields?.nombre) { status = "incompleto"; notes.push("Nombre no detectado"); }
      if (!parsed.fields?.curp) notes.push("CURP no detectado");
    }
    if (doc.doc_type === "cv" && (!parsed.text || parsed.text.length < 80)) {
      status = "incompleto"; notes.push("CV con muy poco texto");
    }

    await supabaseAdmin.from("candidate_documents").update({
      ocr_text: parsed.text ?? null,
      extracted: parsed.fields ?? {},
      validation_status: status,
      validation_notes: notes.join(" · ") || null,
    }).eq("id", documentId);

    await refreshDocCompleteness(doc.candidate_id);
  } catch (e) {
    console.error("[ocr] error:", e);
    await supabaseAdmin.from("candidate_documents")
      .update({ validation_status: "pendiente", validation_notes: "Error OCR · revisar manualmente" })
      .eq("id", documentId);
  }
}

async function refreshDocCompleteness(candidateId: string) {
  const { data: docs } = await supabaseAdmin
    .from("candidate_documents").select("doc_type, validation_status").eq("candidate_id", candidateId);
  const valid = new Set((docs ?? []).filter((d) => d.validation_status === "valido").map((d) => d.doc_type));
  const complete = REQUIRED_DOC_TYPES.every((t) => valid.has(t));
  await supabaseAdmin.from("candidates").update({ documents_complete: complete }).eq("id", candidateId);
  // Recalcular riesgo
  await computeRiskScore(candidateId);
}

export const revalidateDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await runOCRAndValidate(data.id);
    await audit({ actor_id: context.userId, action: "document.revalidate", entity_id: data.id });
    return { ok: true };
  });

// ============================================================
// RISK SCORE LABORAL
// ============================================================
async function computeRiskScore(candidateId: string) {
  const { data: c } = await supabaseAdmin
    .from("candidates")
    .select("phone, age, experience_years, ai_score, documents_complete, status")
    .eq("id", candidateId).maybeSingle();
  if (!c) return;

  let risk = 50;
  // Documentos completos baja riesgo
  if (c.documents_complete) risk -= 20; else risk += 15;
  // Experiencia baja riesgo
  if (typeof c.experience_years === "number") {
    if (c.experience_years >= 5) risk -= 15;
    else if (c.experience_years >= 2) risk -= 8;
    else if (c.experience_years === 0) risk += 10;
  }
  // AI score
  if (typeof c.ai_score === "number") risk -= Math.round((c.ai_score - 50) / 4);
  // Edad fuera rango productivo
  if (typeof c.age === "number" && (c.age < 18 || c.age > 65)) risk += 10;
  // Blacklist por teléfono
  if (c.phone) {
    const { data: bl } = await supabaseAdmin
      .from("candidate_blacklist").select("severity").eq("phone", c.phone).maybeSingle();
    if (bl) risk = 100;
  }
  risk = Math.max(0, Math.min(100, risk));
  await supabaseAdmin.from("candidates").update({ risk_score: risk }).eq("id", candidateId);
}

export const recomputeAllRisk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: ids } = await supabaseAdmin.from("candidates").select("id").limit(500);
    for (const row of ids ?? []) await computeRiskScore(row.id);
    await audit({ actor_id: context.userId, action: "risk.recompute_all", payload: { count: ids?.length ?? 0 } });
    return { ok: true, count: ids?.length ?? 0 };
  });

// ============================================================
// MÉTRICAS RH
// ============================================================
export const getHRMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [candRes, intRes] = await Promise.all([
      supabase.from("candidates").select("status, category, source, ai_score, created_at, hired_at").limit(2000),
      supabase.from("interviews").select("status, scheduled_at").limit(2000),
    ]);
    const cands = candRes.data ?? [];
    const ints = intRes.data ?? [];

    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let hiredCount = 0;
    let totalHireDays = 0;
    let aiSum = 0, aiN = 0;

    for (const c of cands) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      if (c.category) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      bySource[c.source ?? "web"] = (bySource[c.source ?? "web"] ?? 0) + 1;
      if (c.status === "contratado") {
        hiredCount++;
        if (c.hired_at && c.created_at) {
          totalHireDays += (new Date(c.hired_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
        }
      }
      if (typeof c.ai_score === "number") { aiSum += c.ai_score; aiN++; }
    }
    const total = cands.length;
    const approved = (byStatus.aceptado ?? 0) + (byStatus.contratado ?? 0);
    return {
      total_candidates: total,
      by_status: byStatus,
      by_category: byCategory,
      by_source: bySource,
      hired_count: hiredCount,
      approval_rate: total > 0 ? approved / total : 0,
      avg_hire_days: hiredCount > 0 ? totalHireDays / hiredCount : null,
      avg_ai_score: aiN > 0 ? aiSum / aiN : null,
      interviews_total: ints.length,
      interviews_confirmed: ints.filter((i) => i.status === "confirmada").length,
      interviews_completed: ints.filter((i) => i.status === "completada").length,
      interviews_no_show: ints.filter((i) => i.status === "no_show").length,
      active_vacancies: Object.keys(byCategory).length,
    };
  });

// ============================================================
// EXPORTACIONES (CSV)
// ============================================================
export const exportCandidatesCSV = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("candidates")
      .select("full_name, phone, email, position, category, specialty, city, age, experience_years, ai_score, risk_score, status, urgency, source, created_at")
      .order("created_at", { ascending: false }).limit(2000);
    if (error) throw new Error(error.message);
    const headers = ["full_name","phone","email","position","category","specialty","city","age","experience_years","ai_score","risk_score","status","urgency","source","created_at"];
    const escape = (v: unknown) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = (data ?? []).map((c) => headers.map((h) => escape((c as Record<string, unknown>)[h])).join(","));
    return { csv: [headers.join(","), ...rows].join("\n"), count: data?.length ?? 0 };
  });
