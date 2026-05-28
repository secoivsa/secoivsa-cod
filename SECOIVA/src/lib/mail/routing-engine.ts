// Email Routing Engine — classifies inbound mail to departments
// using rules stored in email_routing_rules.

export type Department =
  | "direccion" | "asesoria" | "subgerencia" | "operaciones" | "produccion"
  | "calidad" | "seguridad" | "finanzas" | "comercial" | "rh" | "compras" | "general";

export const DEPARTMENT_LABELS: Record<Department, string> = {
  direccion: "Dirección General",
  asesoria: "Asesoría General",
  subgerencia: "Subgerencia General",
  operaciones: "Operaciones",
  produccion: "Producción",
  calidad: "Calidad",
  seguridad: "Seguridad & MA",
  finanzas: "Finanzas",
  comercial: "Comercial",
  rh: "Recursos Humanos",
  compras: "Compras / Supply",
  general: "General",
};

export const DEPARTMENT_TONE: Record<Department, string> = {
  direccion: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  asesoria: "text-indigo-300 border-indigo-400/30 bg-indigo-400/10",
  subgerencia: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  operaciones: "text-sky-300 border-sky-400/30 bg-sky-400/10",
  produccion: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  calidad: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  seguridad: "text-red-300 border-red-400/30 bg-red-400/10",
  finanzas: "text-yellow-300 border-yellow-400/30 bg-yellow-400/10",
  comercial: "text-fuchsia-300 border-fuchsia-400/30 bg-fuchsia-400/10",
  rh: "text-pink-300 border-pink-400/30 bg-pink-400/10",
  compras: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  general: "text-white/70 border-white/15 bg-white/[0.04]",
};

export type RoutingRule = {
  id: string;
  name: string;
  match_type: string; // keyword | tag | subject_prefix | sender_domain | regex
  pattern: string;
  target_department: Department;
  priority: number;
  active: boolean;
  auto_assign_user?: string | null;
};

export type RoutingInput = {
  subject: string;
  body?: string | null;
  from_email: string;
  tags?: string[];
};

export type RoutingResult = {
  department: Department;
  confidence: number;
  matched_rule_id: string | null;
  matched_rule_name: string | null;
  matched_keywords: string[];
  tag_hits: string[];
};

const TAG_RE = /\[([A-ZÁÉÍÓÚÑ0-9_\-]+)\]/gi;

export function extractTags(subject: string): string[] {
  const out: string[] = [];
  const s = subject || "";
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(s)) !== null) out.push(`[${m[1].toUpperCase()}]`);
  return out;
}

function safeRegex(pattern: string): RegExp | null {
  try { return new RegExp(pattern, "i"); } catch { return null; }
}

export function classifyEmail(input: RoutingInput, rules: RoutingRule[]): RoutingResult {
  const subject = (input.subject || "").trim();
  const body = (input.body || "").trim();
  const haystack = `${subject}\n${body}`.toLowerCase();
  const fromDomain = (input.from_email.split("@")[1] || "").toLowerCase();
  const tagHits = extractTags(subject);
  const activeRules = rules
    .filter((r) => r.active)
    .sort((a, b) => a.priority - b.priority);

  const matchedKeywords: string[] = [];

  for (const rule of activeRules) {
    const pat = rule.pattern.trim();
    if (!pat) continue;

    let hit = false;
    if (rule.match_type === "subject_prefix") {
      hit = subject.toUpperCase().includes(pat.toUpperCase());
      if (hit) matchedKeywords.push(pat);
    } else if (rule.match_type === "tag") {
      const tag = pat.startsWith("[") ? pat.toUpperCase() : `[${pat.toUpperCase()}]`;
      hit = tagHits.includes(tag);
      if (hit) matchedKeywords.push(tag);
    } else if (rule.match_type === "sender_domain") {
      hit = fromDomain.endsWith(pat.toLowerCase().replace(/^@/, ""));
      if (hit) matchedKeywords.push(fromDomain);
    } else if (rule.match_type === "regex") {
      const re = safeRegex(pat);
      hit = !!(re && re.test(haystack));
      if (hit) matchedKeywords.push(pat);
    } else {
      // keyword (supports pipe-separated alternatives)
      const parts = pat.split("|").map((p) => p.trim().toLowerCase()).filter(Boolean);
      const found = parts.filter((p) => haystack.includes(p));
      hit = found.length > 0;
      if (hit) matchedKeywords.push(...found);
    }

    if (hit) {
      const baseConfidence =
        rule.match_type === "subject_prefix" || rule.match_type === "tag" ? 0.95 :
        rule.match_type === "sender_domain" ? 0.85 :
        rule.match_type === "regex" ? 0.8 : 0.7;
      return {
        department: rule.target_department,
        confidence: baseConfidence,
        matched_rule_id: rule.id,
        matched_rule_name: rule.name,
        matched_keywords: matchedKeywords,
        tag_hits: tagHits,
      };
    }
  }

  return {
    department: "general",
    confidence: 0.1,
    matched_rule_id: null,
    matched_rule_name: null,
    matched_keywords: [],
    tag_hits: tagHits,
  };
}
