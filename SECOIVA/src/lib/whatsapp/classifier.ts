import type { BotIntent, ExtractedFields } from "./types";

const POSITIONS = [
  "soldador", "supervisor", "ingeniero", "calidad", "hse", "seguridad",
  "maniobrista", "almacén", "almacen", "auxiliar", "operador", "mecánico",
  "electricista", "obra", "construcción",
];

export function classifyIntent(text: string): BotIntent {
  const t = (text || "").toLowerCase().trim();
  if (!t) return "desconocido";
  if (/^(hola|buenas|hi|hey|saludos|buenos|buen)/.test(t)) return "saludo";
  if (/(empleo|trabajo|chamba|vacante|aplicar|postular|contrat)/.test(t)) return "solicitud_empleo";
  if (/(cv|curriculum|currículum|hoja\s+de\s+vida)/.test(t)) return "envio_cv";
  if (/(gracias|grcs|thx|ok\s*gracias)/.test(t)) return "agradecimiento";
  if (POSITIONS.some((p) => t.includes(p))) return "consulta_vacante";
  if (/^[a-záéíóúñ\s]{4,80}$/i.test(t) && t.split(/\s+/).length >= 2 && t.split(/\s+/).length <= 6) {
    return "datos_personales";
  }
  return "desconocido";
}

export function extractFields(text: string): ExtractedFields {
  const out: ExtractedFields = {};
  const t = (text || "").trim();

  const email = t.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  if (email) out.email = email[0];

  const yrs = t.match(/(\d{1,2})\s*(años|anos|years)/i);
  if (yrs) out.experience_years = parseInt(yrs[1], 10);

  const pos = POSITIONS.find((p) => t.toLowerCase().includes(p));
  if (pos) out.position = pos;

  // Nombre: heurística si la línea contiene 2-5 palabras alfabéticas
  const namable = t.replace(email?.[0] ?? "", "").trim();
  if (/^[a-záéíóúñ\s]{6,80}$/i.test(namable)) {
    const words = namable.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) out.full_name = namable;
  }
  return out;
}

export function detectVacancy(text: string): string | undefined {
  const t = (text || "").toLowerCase();
  const map: Record<string, string> = {
    soldador: "Soldador Calificado 6G",
    supervisor: "Supervisor de Obra Industrial",
    calidad: "Ingeniero de Calidad",
    hse: "Coordinador HSE",
    seguridad: "Coordinador HSE",
    maniobrista: "Maniobrista Industrial",
    almacén: "Auxiliar de Almacén",
    almacen: "Auxiliar de Almacén",
  };
  for (const [k, v] of Object.entries(map)) if (t.includes(k)) return v;
  return undefined;
}
