import { createHmac, timingSafeEqual } from "crypto";
import type { WhatsAppProvider, InboundMessage, OutboundMessage, SendResult } from "../types";

// Meta Cloud API (WhatsApp Business Platform).
// Requiere env: WHATSAPP_PHONE_ID, WHATSAPP_TOKEN, WHATSAPP_VERIFY_TOKEN,
// WHATSAPP_APP_SECRET (para validar firma X-Hub-Signature-256).
export const metaCloudProvider: WhatsAppProvider = {
  name: "meta_cloud",

  verifyChallenge(params) {
    const mode = params.get("hub.mode");
    const token = params.get("hub.verify_token");
    const challenge = params.get("hub.challenge");
    if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  },

  async send(msg: OutboundMessage): Promise<SendResult> {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;
    if (!phoneId || !token) {
      return { ok: false, error: "WhatsApp Cloud credentials not configured" };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: msg.to,
          type: "text",
          text: { body: msg.body },
        }),
      });
      const data = (await res.json()) as { messages?: Array<{ id: string }>; error?: { message?: string } };
      if (!res.ok) {
        return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
      }
      return { ok: true, providerMessageId: data.messages?.[0]?.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "unknown error" };
    }
  },

  async parseWebhook(payload, signature, rawBody): Promise<InboundMessage[]> {
    const secret = process.env.WHATSAPP_APP_SECRET;
    if (secret && rawBody && signature) {
      const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
      const a = Buffer.from(signature);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new Error("invalid_signature");
      }
    }

    const out: InboundMessage[] = [];
    const p = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              id: string;
              from: string;
              timestamp: string;
              type: string;
              text?: { body?: string };
              image?: { id: string; mime_type?: string };
              document?: { id: string; mime_type?: string; filename?: string };
            }>;
          };
        }>;
      }>;
    };

    for (const entry of p.entry ?? []) {
      for (const ch of entry.changes ?? []) {
        for (const m of ch.value?.messages ?? []) {
          out.push({
            providerMessageId: m.id,
            from: m.from,
            body: m.text?.body ?? m.document?.filename ?? "",
            mediaMime: m.image?.mime_type ?? m.document?.mime_type,
            timestamp: parseInt(m.timestamp, 10) * 1000,
            raw: m,
          });
        }
      }
    }
    return out;
  },
};
