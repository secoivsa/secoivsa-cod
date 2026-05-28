// RH AI Recruiting Copilot — conversational engine powered by Lovable AI Gateway.
// Sin menús rígidos: NLP intent + memoria contextual + scoring automático.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getWhatsAppProvider } from "./provider";
import type { InboundMessage } from "./types";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type DB = SupabaseClient<Database>;

async function audit(
  db: DB,
  level: "info" | "warning" | "error" | "debug",
  message: string,
  payload: Record<string, unknown> = {},
) {
  try {
    await db.from("whatsapp_logs").insert({
      organization_id: DEFAULT_ORG,
      level,
      message: `[ai] ${message}`,
      payload: payload as never,
    });
  } catch (e) {
    console.error("[ai-engine] audit failed", e);
  }
}


type Category =
  | "soldador" | "tubero" | "supervisor" | "seguridad" | "calidad"
  | "operador" | "electricista" | "maniobrista" | "almacen"
  | "administrativo" | "ingenieria" | "otro";

type Profile = {
  full_name?: string;
  email?: string;
  age?: number;
  city?: string;
  position?: string;
  category?: Category;
  specialty?: string;
  seniority?: "junior" | "mid" | "senior" | "experto";
  experience_years?: number;
  location?: string;
  availability?: string;
  certifications?: string[];
  tags?: string[];
  ai_score?: number;
  urgency?: "baja" | "media" | "alta";
  ai_summary?: string;
  complete?: boolean;
};

type Turn = { role: "user" | "assistant"; content: string };

type AIResult = {
  reply: string;
  profile_updates: Profile;
  intent: string;
  is_complete: boolean;
};

const SYSTEM_PROMPT = `Eres "Sofía", reclutadora virtual de SECOIVSA (empresa industrial mexicana de soldadura, obra civil, calidad y HSE).

Tu misión: tener una conversación natural por WhatsApp con un candidato, entender qué busca, extraer su perfil, clasificarlo y dejarlo listo para que un reclutador humano lo contacte.

REGLAS DE CONVERSACIÓN:
- Tono cálido, profesional, mexicano, breve. Máx 2 frases por mensaje.
- NUNCA muestres menús numerados ni listas rígidas tipo "1) opción".
- Haz UNA pregunta a la vez, la más útil para llenar huecos del perfil.
- Si el candidato dice "he trabajado en plataformas" → infiere experiencia industrial offshore.
- Si dice "soy soldador TIG" → specialty=soldadura TIG, position=Soldador.
- Si dice "no tengo experiencia" → seniority=junior, no insistas en años.
- Captura progresivamente: nombre, edad, ciudad, puesto deseado, experiencia (años), especialidad, certificaciones, disponibilidad (inmediata / 2 semanas / fecha).
- Si el candidato manda audio, PDF o foto: agradece, confirma recepción y sigue extrayendo perfil. NO inventes contenido.
- Si comparte ubicación: regístrala como city/location y agradece.
- Si ya tienes nombre + puesto/especialidad + nivel de experiencia + ciudad → marca complete=true y despídete confirmando que un reclutador lo contactará en horario hábil.
- Usa emojis con moderación (1 por mensaje máx).

VACANTES ACTIVAS (única lista válida — NO inventes otras): Soldador 6G, Soldador TIG/MIG, Supervisor de Obra, Ingeniero de Calidad, Coordinador HSE, Maniobrista, Auxiliar de Almacén, Operador, Electricista industrial.

GUARDRAILS EMPRESARIALES (NO NEGOCIABLES):
- NUNCA inventes ni estimes salarios, sueldos, tabuladores ni rangos económicos.
- NUNCA prometas contratación, entrevista garantizada, fecha de inicio ni resultado del proceso.
- NUNCA inventes vacantes fuera de la lista de VACANTES ACTIVAS.
- NUNCA inventes horarios, turnos, rotaciones ni jornadas específicas.
- NUNCA inventes prestaciones, bonos, viáticos, hospedaje, transporte ni beneficios.
- NUNCA inventes ubicaciones de obra, proyectos, clientes ni duraciones.
- NUNCA des asesoría legal, fiscal o migratoria.

Si el candidato pregunta por salario, horario, prestaciones, ubicación, fecha de arranque, duración del proyecto, o cualquier dato que NO esté explícitamente en este prompt:
→ Responde con honestidad: "Esa info la confirma directamente el equipo de RH cuando te contacten."
→ Marca intent="escalar_humano" y agrega "requiere_rh" al array tags.
→ Continúa la conversación recolectando datos del perfil; no te bloquees.

Si el candidato insiste o pide compromisos: reitera amablemente que sólo RH humano puede confirmarlo y sugiere agendar la llamada con el reclutador.


SCORING (0-100):
- 80-100: experto con certificaciones, encaja en vacante activa, disponible.
- 60-79: mid/senior con experiencia relevante.
- 40-59: junior con potencial o experiencia parcial.
- 0-39: sin fit aparente o info insuficiente.

URGENCIA:
- alta: vacante crítica (Soldador 6G, Supervisor) + perfil sólido.
- media: vacante activa + perfil aceptable.
- baja: resto.

Devuelve SIEMPRE JSON válido con esta forma exacta (sin texto fuera del JSON):
{
  "reply": "string — tu próximo mensaje de WhatsApp",
  "intent": "saludo|interes_vacante|datos_personales|experiencia|cierre|escalar_humano|otro",
  "profile_updates": {
    "full_name": "string opcional",
    "age": "number opcional",
    "city": "string opcional",
    "position": "string opcional",
    "category": "soldador|tubero|supervisor|seguridad|calidad|operador|electricista|maniobrista|almacen|administrativo|ingenieria|otro — clasifica el oficio principal del candidato",
    "specialty": "string opcional (ej: soldadura TIG 6G, tubería de proceso, etc.)",
    "seniority": "junior|mid|senior|experto opcional",
    "experience_years": "number opcional",
    "location": "string opcional",
    "availability": "string opcional (inmediata, 2 semanas, fecha)",
    "certifications": ["array opcional"],
    "tags": ["array opcional de palabras clave"],
    "ai_score": "number 0-100 opcional (sólo cuando tengas suficiente info)",
    "urgency": "baja|media|alta opcional",
    "ai_summary": "string opcional, 1 línea resumen ejecutivo"
  },
  "is_complete": false
}`;

async function callAI(db: DB, history: Turn[], profile: Profile): Promise<AIResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    await audit(db, "error", "LOVABLE_API_KEY ausente — usando fallback", {});
    return {
      reply: "👋 Hola, soy Sofía de SECOIVSA. Cuéntame tu nombre y qué puesto te interesa.",
      profile_updates: {},
      intent: "saludo",
      is_complete: false,
    };
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "system" as const,
      content: `Perfil acumulado del candidato hasta ahora:\n${JSON.stringify(profile, null, 2)}`,
    },
    ...history.map((t) => ({ role: t.role, content: t.content })),
  ];

  const lastUser = [...history].reverse().find((t) => t.role === "user")?.content ?? "";
  await audit(db, "debug", "Prompt enviado a IA", {
    model: MODEL,
    turns: history.length,
    last_user: lastUser.slice(0, 240),
    profile_keys: Object.keys(profile),
  });
  const t0 = Date.now();

  try {
    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ai-engine] gateway error", res.status, errText);
      await audit(db, "error", `Gateway IA respondió ${res.status}`, {
        status: res.status,
        body: errText.slice(0, 500),
        latency_ms: Date.now() - t0,
      });
      return fallback(profile);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AIResult>;
    const result: AIResult = {
      reply: parsed.reply ?? "Cuéntame un poco más sobre tu experiencia.",
      profile_updates: parsed.profile_updates ?? {},
      intent: parsed.intent ?? "otro",
      is_complete: Boolean(parsed.is_complete),
    };
    await audit(db, "info", "Respuesta IA generada", {
      latency_ms: Date.now() - t0,
      intent: result.intent,
      reply_preview: result.reply.slice(0, 240),
      is_complete: result.is_complete,
      updates_keys: Object.keys(result.profile_updates),
    });
    return result;
  } catch (e) {
    console.error("[ai-engine] exception", e);
    await audit(db, "error", `Excepción IA: ${e instanceof Error ? e.message : String(e)}`, {
      latency_ms: Date.now() - t0,
    });
    return fallback(profile);
  }
}


function fallback(profile: Profile): AIResult {
  if (!profile.full_name) {
    return {
      reply: "👋 Hola, soy Sofía de SECOIVSA. ¿Cómo te llamas?",
      profile_updates: {},
      intent: "saludo",
      is_complete: false,
    };
  }
  return {
    reply: "Gracias, en un momento un reclutador revisa tu perfil.",
    profile_updates: {},
    intent: "cierre",
    is_complete: true,
  };
}

function mergeProfile(a: Profile, b: Profile): Profile {
  return {
    ...a,
    ...Object.fromEntries(
      Object.entries(b).filter(([, v]) => v !== undefined && v !== null && v !== ""),
    ),
  };
}

export async function handleInboundAI(db: DB, msg: InboundMessage): Promise<void> {
  const phone = msg.from.replace(/\D/g, "");
  const body = (msg.body ?? "").trim();
  if (!body && !msg.mediaUrl) return;

  // Sesión
  const { data: sess } = await db
    .from("bot_sessions")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  let candidateId = sess?.candidate_id as string | null;
  const profile = ((sess?.profile as Profile) ?? {}) as Profile;
  const turnCount = (sess?.turn_count as number) ?? 0;

  // Candidato
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
          metadata: { first_message: body.slice(0, 240) },
        })
        .select("id")
        .single();
      candidateId = created?.id ?? null;
      if (candidateId) {
        await db.from("candidate_timeline").insert({
          organization_id: DEFAULT_ORG,
          candidate_id: candidateId,
          event_type: "candidate.created",
          title: "Candidato creado vía WhatsApp (AI)",
          description: `Tel: +${phone}`,
        });
      }
    }
  }
  if (!candidateId) return;

  // Persistir mensaje entrante
  await db.from("candidate_messages").insert({
    organization_id: DEFAULT_ORG,
    candidate_id: candidateId,
    direction: "in",
    channel: "whatsapp",
    body,
    media_url: msg.mediaUrl,
    provider_message_id: msg.providerMessageId,
  });

  // Reconstruir historial (últimos 12 turnos)
  const { data: recent } = await db
    .from("candidate_messages")
    .select("direction, body, created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(12);

  const history: Turn[] = (recent ?? [])
    .reverse()
    .map((m) => ({
      role: (m.direction === "in" ? "user" : "assistant") as "user" | "assistant",
      content: m.body ?? "",
    }))
    .filter((t) => t.content);

  // Llamar IA
  await audit(db, "info", `IA ejecutada → +${phone}`, {
    phone,
    candidate_id: candidateId,
    history_turns: history.length,
    inbound_preview: body.slice(0, 240),
  });
  const ai = await callAI(db, history, profile);

  const newProfile = mergeProfile(profile, ai.profile_updates);

  // Actualizar candidato con datos extraídos
  const candidatePatch: Record<string, unknown> = {
    last_contact_at: new Date().toISOString(),
  };
  if (newProfile.full_name) candidatePatch.full_name = newProfile.full_name;
  if (newProfile.email) candidatePatch.email = newProfile.email;
  if (typeof newProfile.age === "number") candidatePatch.age = newProfile.age;
  if (newProfile.city) candidatePatch.city = newProfile.city;
  if (newProfile.position) candidatePatch.position = newProfile.position;
  if (newProfile.category) candidatePatch.category = newProfile.category;
  if (newProfile.specialty) candidatePatch.specialty = newProfile.specialty;
  if (newProfile.seniority) candidatePatch.seniority = newProfile.seniority;
  if (newProfile.availability) candidatePatch.availability = newProfile.availability;
  if (typeof newProfile.experience_years === "number")
    candidatePatch.experience_years = newProfile.experience_years;
  if (typeof newProfile.ai_score === "number") candidatePatch.ai_score = newProfile.ai_score;
  if (newProfile.urgency) candidatePatch.urgency = newProfile.urgency;
  if (newProfile.ai_summary) candidatePatch.ai_summary = newProfile.ai_summary;
  if (newProfile.tags?.length) candidatePatch.ai_tags = newProfile.tags;
  if (ai.is_complete) candidatePatch.status = "en_revision";

  await db.from("candidates").update(candidatePatch as never).eq("id", candidateId);

  // Timeline rico
  await db.from("candidate_timeline").insert({
    organization_id: DEFAULT_ORG,
    candidate_id: candidateId,
    event_type: ai.is_complete ? "candidate.qualified" : "candidate.turn",
    title: ai.is_complete
      ? `Calificado por AI (${newProfile.ai_score ?? "?"}/100)`
      : `Turno ${turnCount + 1} · intent: ${ai.intent}`,
    description: ai.is_complete
      ? newProfile.ai_summary ?? "Perfil completo"
      : body.slice(0, 240),
  });

  if (ai.is_complete) {
    await db.from("notifications").insert({
      organization_id: DEFAULT_ORG,
      role_target: "rh",
      type: "info",
      category: "hr",
      title: `Nuevo candidato AI · score ${newProfile.ai_score ?? "?"}`,
      message: `${newProfile.full_name ?? phone} — ${newProfile.position ?? "Sin puesto"} (${newProfile.seniority ?? "n/d"})`,
      link: "/nexus/recruiting",
    });
  } else if (ai.intent === "escalar_humano") {
    await db.from("notifications").insert({
      organization_id: DEFAULT_ORG,
      role_target: "rh",
      type: "warning",
      category: "hr",
      title: "Candidato pide datos sensibles",
      message: `${newProfile.full_name ?? phone} preguntó por salario/horario/prestaciones. Requiere contacto humano.`,
      link: "/nexus/recruiting",
    });
  }

  // Sesión
  await db
    .from("bot_sessions")
    .upsert(
      {
        phone,
        candidate_id: candidateId,
        state: ai.is_complete ? "complete" : "active",
        context: { last_intent: ai.intent } as never,
        profile: newProfile as never,
        turn_count: turnCount + 1,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "phone" },
    );

  // Enviar respuesta
  const provider = getWhatsAppProvider();
  await audit(db, "debug", `Outbound payload → +${phone}`, {
    provider: provider.name,
    to: phone,
    body_preview: ai.reply.slice(0, 240),
  });
  const tSend = Date.now();
  const sent = await provider.send({ to: phone, body: ai.reply });
  await audit(
    db,
    sent.ok ? "info" : "error",
    sent.ok ? `UAZAPI 200 → +${phone}` : `UAZAPI falló → +${phone}: ${sent.error ?? "?"}`,
    {
      provider: provider.name,
      ok: sent.ok,
      provider_message_id: sent.providerMessageId,
      error: sent.error ?? null,
      latency_ms: Date.now() - tSend,
    },
  );
  await db.from("candidate_messages").insert({
    organization_id: DEFAULT_ORG,
    candidate_id: candidateId,
    direction: "out",
    channel: "whatsapp",
    body: ai.reply,
    provider_message_id: sent.providerMessageId,
    metadata: {
      provider: provider.name,
      ok: sent.ok,
      error: sent.error,
      intent: ai.intent,
      ai_model: MODEL,
    },
  });
}

