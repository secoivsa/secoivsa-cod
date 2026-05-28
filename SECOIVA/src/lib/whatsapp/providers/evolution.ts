import type { WhatsAppProvider, InboundMessage, OutboundMessage, SendResult } from "../types";

// Evolution API (self-hosted). Env: EVOLUTION_URL, EVOLUTION_KEY, EVOLUTION_INSTANCE.
export const evolutionProvider: WhatsAppProvider = {
  name: "evolution",

  async send(msg: OutboundMessage): Promise<SendResult> {
    const base = process.env.EVOLUTION_URL;
    const key = process.env.EVOLUTION_KEY;
    const inst = process.env.EVOLUTION_INSTANCE;
    if (!base || !key || !inst) return { ok: false, error: "Evolution API not configured" };
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/message/sendText/${inst}`, {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        body: JSON.stringify({ number: msg.to, text: msg.body }),
      });
      const data = (await res.json()) as { key?: { id?: string }; message?: string };
      if (!res.ok) return { ok: false, error: data?.message ?? `HTTP ${res.status}` };
      return { ok: true, providerMessageId: data.key?.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "unknown error" };
    }
  },

  async parseWebhook(payload): Promise<InboundMessage[]> {
    const p = payload as {
      event?: string;
      data?: {
        key?: { id?: string; remoteJid?: string; fromMe?: boolean };
        message?: { conversation?: string; extendedTextMessage?: { text?: string } };
        messageTimestamp?: number;
      };
    };
    const d = p.data;
    if (!d || d.key?.fromMe) return [];
    const from = (d.key?.remoteJid ?? "").split("@")[0];
    const body = d.message?.conversation ?? d.message?.extendedTextMessage?.text ?? "";
    if (!from) return [];
    return [{
      providerMessageId: d.key?.id ?? `evo_${Date.now()}`,
      from,
      body,
      timestamp: (d.messageTimestamp ?? Date.now() / 1000) * 1000,
      raw: p,
    }];
  },
};
