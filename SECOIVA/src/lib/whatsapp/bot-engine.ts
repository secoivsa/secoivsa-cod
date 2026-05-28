import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { classifyIntent, extractFields, detectVacancy } from "./classifier";
import { getWhatsAppProvider } from "./provider";
import type { InboundMessage } from "./types";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

type DB = SupabaseClient<Database>;

const REPLIES = {
  greeting: "👋 ¡Hola! Soy el asistente de Recursos Humanos de SECOIVSA.\n\n¿Estás interesado en una vacante? Responde con tu *nombre completo* para iniciar tu registro.",
  ask_position: "Gracias. ¿Qué *puesto* te interesa?\n\nVacantes activas:\n• Soldador 6G\n• Supervisor de Obra\n• Ingeniero de Calidad\n• Coordinador HSE\n• Maniobrista\n• Auxiliar de Almacén",
  ask_cv: "Perfecto. Envíanos tu *CV en PDF* o describe brevemente tu experiencia (años, empresas previas).",
  complete: "✅ Tu registro fue recibido. Un reclutador de SECOIVSA revisará tu perfil y te contactará pronto.\n\nFolio interno: {folio}",
  fallback: "No te entendí. Escribe *EMPLEO* para iniciar el proceso de postulación.",
};

export async function handleInbound(db: DB, msg: InboundMessage): Promise<void> {
  const phone = msg.from.replace(/\D/g, "");
  const body = (msg.body ?? "").trim();

  // 1) Upsert sesión
  const { data: sess } = await db
    .from("bot_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  let candidateId = sess?.candidate_id as string | null;
  let state = (sess?.state as string) ?? "greeting";
  const context = (sess?.context as Record<string, unknown>) ?? {};

  // 2) Upsert candidato
  if (!candidateId) {
    const { data: existing } = await db
      .from("candidates")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (existing) {
      candidateId = existing.id;
    } else {
      const { data: created } = await db
        .from("candidates")
        .insert({
          organization_id: DEFAULT_ORG,
          phone,
          source: "whatsapp",
          status: "nuevo",
          metadata: { first_message: body.slice(0, 200) },
        })
        .select("id")
        .single();
      candidateId = created?.id ?? null;
      if (candidateId) {
        await db.from("candidate_timeline").insert({
          organization_id: DEFAULT_ORG,
          candidate_id: candidateId,
          event_type: "candidate.created",
          title: "Candidato creado vía WhatsApp",
          description: `Tel: +${phone}`,
        });
      }
    }
  }

  if (!candidateId) return;

  // 3) Guardar mensaje entrante
  await db.from("candidate_messages").insert({
    organization_id: DEFAULT_ORG,
    candidate_id: candidateId,
    direction: "in",
    channel: "whatsapp",
    body,
    media_url: msg.mediaUrl,
    provider_message_id: msg.providerMessageId,
  });

  // 4) Extraer & clasificar
  const intent = classifyIntent(body);
  const extracted = extractFields(body);
  const vacancy = detectVacancy(body);

  const patch: Record<string, unknown> = { last_contact_at: new Date().toISOString() };
  if (extracted.full_name && !context.full_name_set) {
    patch.full_name = extracted.full_name;
    context.full_name_set = true;
  }
  if (extracted.email) patch.email = extracted.email;
  if (vacancy || extracted.position) patch.position = vacancy ?? extracted.position;
  if (Object.keys(patch).length > 1) {
    await db.from("candidates").update(patch as never).eq("id", candidateId);
  }

  // 5) State machine
  let reply = REPLIES.fallback;
  let nextState = state;

  if (state === "greeting" || intent === "saludo" || intent === "solicitud_empleo") {
    reply = REPLIES.greeting;
    nextState = "awaiting_name";
  } else if (state === "awaiting_name" && (intent === "datos_personales" || extracted.full_name)) {
    reply = REPLIES.ask_position;
    nextState = "awaiting_position";
  } else if (state === "awaiting_position" && (intent === "consulta_vacante" || vacancy)) {
    reply = REPLIES.ask_cv;
    nextState = "awaiting_cv";
  } else if (state === "awaiting_cv") {
    const folio = candidateId.slice(0, 8).toUpperCase();
    reply = REPLIES.complete.replace("{folio}", folio);
    nextState = "complete";
    await db.from("candidates").update({ status: "en_revision" }).eq("id", candidateId);
    await db.from("candidate_timeline").insert({
      organization_id: DEFAULT_ORG,
      candidate_id: candidateId,
      event_type: "candidate.complete",
      title: "Registro WhatsApp completado",
      description: body.slice(0, 280),
    });
    await db.from("notifications").insert({
      organization_id: DEFAULT_ORG,
      role_target: "rh",
      type: "info",
      category: "hr",
      title: "Nuevo candidato WhatsApp",
      message: `${patch.full_name ?? phone} listo para revisión`,
      link: "/nexus/recruiting",
    });
  } else if (intent === "agradecimiento") {
    reply = "🙌 Gracias a ti. Estaremos en contacto.";
  }

  // 6) Persistir sesión
  await db.from("bot_sessions").upsert({
    phone,
    candidate_id: candidateId,
    state: nextState,
    context: context as never,
    last_message_at: new Date().toISOString(),
  }, { onConflict: "phone" });

  // 7) Enviar respuesta
  const provider = getWhatsAppProvider();
  const sent = await provider.send({ to: phone, body: reply });
  await db.from("candidate_messages").insert({
    organization_id: DEFAULT_ORG,
    candidate_id: candidateId,
    direction: "out",
    channel: "whatsapp",
    body: reply,
    provider_message_id: sent.providerMessageId,
    metadata: { provider: provider.name, ok: sent.ok, error: sent.error },
  });
}
