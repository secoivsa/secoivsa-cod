import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

const PhoneSchema = z.string().trim().min(8).max(20).regex(/^[+\d\s().-]+$/);
const EmailSchema = z.string().trim().email().max(255).optional().or(z.literal(""));

// Submit público desde /solicitar-empleo: NO requiere auth.
export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      full_name: z.string().trim().min(2).max(120),
      phone: PhoneSchema,
      email: EmailSchema,
      position: z.string().trim().min(2).max(120),
      city: z.string().trim().max(120).optional(),
      experience: z.string().trim().max(2000).optional(),
      message: z.string().trim().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const phone = data.phone.replace(/\D/g, "");

    // De-dupe: si ya existe por teléfono, actualiza datos y crea evento.
    const { data: existing } = await supabaseAdmin
      .from("candidates")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    let candidateId = existing?.id as string | undefined;

    if (!candidateId) {
      const { data: created, error } = await supabaseAdmin
        .from("candidates")
        .insert({
          organization_id: DEFAULT_ORG,
          full_name: data.full_name,
          phone,
          email: data.email || null,
          position: data.position,
          source: "web",
          status: "nuevo",
          metadata: { city: data.city ?? null, experience: data.experience ?? null },
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      candidateId = created.id;
    } else {
      await supabaseAdmin
        .from("candidates")
        .update({
          full_name: data.full_name,
          email: data.email || null,
          position: data.position,
          last_contact_at: new Date().toISOString(),
        })
        .eq("id", candidateId);
    }

    await supabaseAdmin.from("candidate_timeline").insert({
      organization_id: DEFAULT_ORG,
      candidate_id: candidateId,
      event_type: "application.web",
      title: "Postulación web recibida",
      description: `Vacante: ${data.position}${data.city ? ` · ${data.city}` : ""}`,
      metadata: { experience: data.experience, message: data.message },
    });

    if (data.message) {
      await supabaseAdmin.from("candidate_messages").insert({
        organization_id: DEFAULT_ORG,
        candidate_id: candidateId,
        direction: "in",
        channel: "web",
        body: data.message,
      });
    }

    await supabaseAdmin.from("notifications").insert({
      organization_id: DEFAULT_ORG,
      role_target: "rh",
      type: "info",
      category: "hr",
      title: "Nueva postulación",
      message: `${data.full_name} → ${data.position}`,
      link: "/nexus/recruiting",
    });

    return { ok: true, candidateId, folio: candidateId.slice(0, 8).toUpperCase() };
  });

// Lista de candidatos (auth).
export const listCandidates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("candidates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { candidates: data ?? [] };
  });

// Detalle (auth).
export const getCandidate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: candidate }, { data: messages }, { data: timeline }, { data: docs }] = await Promise.all([
      supabase.from("candidates").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("candidate_messages").select("*").eq("candidate_id", data.id).order("created_at", { ascending: true }),
      supabase.from("candidate_timeline").select("*").eq("candidate_id", data.id).order("created_at", { ascending: false }),
      supabase.from("candidate_documents").select("*").eq("candidate_id", data.id).order("created_at", { ascending: false }),
    ]);
    return { candidate, messages: messages ?? [], timeline: timeline ?? [], documents: docs ?? [] };
  });

// Cambia estatus (auth).
export const updateCandidateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["nuevo", "en_revision", "entrevista", "aceptado", "rechazado", "contratado", "descartado"]),
      note: z.string().trim().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("candidates")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabase.from("candidate_timeline").insert({
      candidate_id: data.id,
      event_type: "status.changed",
      title: `Estatus: ${data.status}`,
      description: data.note ?? null,
      actor_id: userId,
    });
    return { ok: true };
  });

// Enviar mensaje WhatsApp manual desde el panel (auth).
export const sendWhatsAppReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      candidate_id: z.string().uuid(),
      body: z.string().trim().min(1).max(1500),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: cand } = await supabase
      .from("candidates")
      .select("phone")
      .eq("id", data.candidate_id)
      .maybeSingle();
    if (!cand?.phone) throw new Error("Candidato sin teléfono");

    const { getWhatsAppProvider } = await import("./whatsapp/provider");
    const sent = await getWhatsAppProvider().send({ to: cand.phone, body: data.body });

    await supabase.from("candidate_messages").insert({
      candidate_id: data.candidate_id,
      direction: "out",
      channel: "whatsapp",
      body: data.body,
      provider_message_id: sent.providerMessageId,
      metadata: { manual: true, ok: sent.ok, error: sent.error },
    });
    return { ok: sent.ok, error: sent.error };
  });

// Simular mensaje entrante (auth) — útil para probar sin credenciales reales.
export const simulateInboundMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      from: z.string().trim().min(8).max(20),
      body: z.string().trim().min(1).max(1500),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { handleInbound } = await import("./whatsapp/bot-engine");
    await handleInbound(supabaseAdmin, {
      providerMessageId: `sim_${Date.now()}`,
      from: data.from.replace(/\D/g, ""),
      body: data.body,
      timestamp: Date.now(),
      raw: data,
    });
    return { ok: true };
  });
