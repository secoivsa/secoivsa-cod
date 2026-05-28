import type { WhatsAppProvider, InboundMessage, OutboundMessage, SendResult } from "../types";

// Provider placeholder: no envía mensajes reales, pero acepta payloads
// simulados (forma Meta Cloud) para desarrollo sin credenciales.
export const placeholderProvider: WhatsAppProvider = {
  name: "placeholder",
  async send(msg: OutboundMessage): Promise<SendResult> {
    // eslint-disable-next-line no-console
    console.log("[wa:placeholder] →", msg.to, msg.body);
    return { ok: true, providerMessageId: `placeholder_${Date.now()}` };
  },
  async parseWebhook(payload: unknown): Promise<InboundMessage[]> {
    // Acepta formato simulado: { from, body } o array
    const arr = Array.isArray(payload) ? payload : [payload];
    return arr
      .filter((p): p is { from: string; body?: string } => !!p && typeof (p as { from?: unknown }).from === "string")
      .map((p) => ({
        providerMessageId: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        from: p.from.replace(/\D/g, ""),
        body: p.body ?? "",
        timestamp: Date.now(),
        raw: p,
      }));
  },
};
