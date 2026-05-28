// UAZAPI provider (gestionado). Soporta QR persistente + media.
// Env: UAZAPI_URL, UAZAPI_INSTANCE_TOKEN.
import type { InboundMessage, OutboundMessage, SendResult, WhatsAppProvider } from "../types";

function base() {
  return (process.env.UAZAPI_URL ?? "").replace(/\/$/, "");
}
function token() {
  return process.env.UAZAPI_INSTANCE_TOKEN ?? "";
}
function headers(): Record<string, string> {
  return { token: token(), "Content-Type": "application/json" };
}

export type UazapiStatus = {
  status: "disconnected" | "connecting" | "connected" | "qr_pending" | "error";
  phone_number?: string;
  qr_base64?: string;
  raw: unknown;
};

export async function uazapiConnect(): Promise<UazapiStatus> {
  if (!base() || !token()) return { status: "error", raw: { error: "UAZAPI not configured" } };
  try {
    const res = await fetch(`${base()}/instance/connect`, { method: "POST", headers: headers(), body: "{}" });
    const data = (await res.json()) as {
      connected?: boolean; loggedIn?: boolean; name?: string;
      qrcode?: string; instance?: { status?: string; profileName?: string; wid?: string };
    };
    const qr = data.qrcode ?? "";
    const connected = Boolean(data.connected ?? data.loggedIn);
    const phone = data.instance?.wid?.split("@")[0];
    if (connected) return { status: "connected", phone_number: phone, raw: data };
    if (qr) return { status: "qr_pending", qr_base64: qr, raw: data };
    return { status: "connecting", raw: data };
  } catch (e) {
    return { status: "error", raw: { error: e instanceof Error ? e.message : String(e) } };
  }
}

export async function uazapiStatus(): Promise<UazapiStatus> {
  if (!base() || !token()) return { status: "error", raw: { error: "UAZAPI not configured" } };
  try {
    const res = await fetch(`${base()}/instance/status`, { method: "GET", headers: headers() });
    const data = (await res.json()) as {
      connected?: boolean; loggedIn?: boolean;
      instance?: { status?: string; wid?: string; profileName?: string };
    };
    const phone = data.instance?.wid?.split("@")[0];
    if (data.connected || data.loggedIn || data.instance?.status === "connected") {
      return { status: "connected", phone_number: phone, raw: data };
    }
    return { status: "disconnected", raw: data };
  } catch (e) {
    return { status: "error", raw: { error: e instanceof Error ? e.message : String(e) } };
  }
}

export async function uazapiDisconnect(): Promise<boolean> {
  if (!base() || !token()) return false;
  try {
    await fetch(`${base()}/instance/disconnect`, { method: "POST", headers: headers(), body: "{}" });
    return true;
  } catch { return false; }
}

export async function uazapiSendMedia(to: string, mediaUrl: string, kind: "image" | "document" | "audio" | "video", caption?: string): Promise<SendResult> {
  if (!base() || !token()) return { ok: false, error: "UAZAPI not configured" };
  try {
    const res = await fetch(`${base()}/send/media`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ number: to, type: kind, file: mediaUrl, text: caption ?? "" }),
    });
    const data = (await res.json()) as { id?: string; messageid?: string; message?: string };
    if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}` };
    return { ok: true, providerMessageId: data.id ?? data.messageid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export const uazapiProvider: WhatsAppProvider = {
  name: "evolution", // re-using enum value; UI labels as 'uazapi'
  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!base() || !token()) {
      console.error("[uazapi] send aborted: UAZAPI_URL or UAZAPI_INSTANCE_TOKEN missing");
      return { ok: false, error: "UAZAPI not configured (faltan UAZAPI_URL / UAZAPI_INSTANCE_TOKEN)" };
    }
    try {
      const url = `${base()}/send/text`;
      const payload = { number: msg.to, text: msg.body };
      console.log("[uazapi] POST", url, "→", msg.to, msg.body.slice(0, 80));
      const res = await fetch(url, {
        method: "POST", headers: headers(),
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { id?: string; messageid?: string; message?: string } = {};
      try { data = JSON.parse(text); } catch { /* keep raw */ }
      console.log("[uazapi] response", res.status, text.slice(0, 300));
      if (!res.ok) return { ok: false, error: data.message ?? `HTTP ${res.status}: ${text.slice(0, 160)}` };
      return { ok: true, providerMessageId: data.id ?? data.messageid };
    } catch (e) {
      console.error("[uazapi] send exception", e);
      return { ok: false, error: e instanceof Error ? e.message : "unknown" };
    }
  },

  async parseWebhook(payload): Promise<InboundMessage[]> {
    // UAZAPI puede mandar shapes muy variados según versión / event.
    // Soportamos: { message } | { messages: [] } | { data: { message } } | Baileys-style { key, message }
    const p = payload as Record<string, unknown>;
    const eventType = String(
      (p.EventType ?? p.event ?? p.type ?? "") as string,
    ).toLowerCase();
    // Sólo procesamos eventos de mensajes entrantes
    if (eventType && !/(message|messages|messages\.upsert|chat)/.test(eventType)) {
      return [];
    }

    const candidates: Array<Record<string, unknown>> = [];
    const pushMaybe = (v: unknown) => {
      if (!v) return;
      if (Array.isArray(v)) v.forEach(pushMaybe);
      else if (typeof v === "object") candidates.push(v as Record<string, unknown>);
    };
    pushMaybe(p.message);
    pushMaybe(p.messages);
    pushMaybe((p.data as Record<string, unknown> | undefined)?.message);
    pushMaybe((p.data as Record<string, unknown> | undefined)?.messages);
    if (p.key || p.remoteJid || p.sender || p.chatid) candidates.push(p);

    const out: InboundMessage[] = [];
    for (const m of candidates) {
      const fromMe = Boolean(
        m.fromMe ?? (m.key as Record<string, unknown> | undefined)?.fromMe,
      );
      if (fromMe) continue;
      const rawFrom =
        (m.sender as string | undefined) ??
        (m.chatid as string | undefined) ??
        (m.from as string | undefined) ??
        ((m.key as Record<string, unknown> | undefined)?.remoteJid as string | undefined) ??
        (m.remoteJid as string | undefined) ??
        "";
      const from = String(rawFrom).split("@")[0].replace(/\D/g, "");
      if (!from) continue;

      // body puede venir como: text, caption, content, conversation, message.conversation, message.extendedTextMessage.text
      const innerMsg = (m.message as Record<string, unknown> | undefined) ?? {};
      const body =
        (m.text as string | undefined) ??
        (m.caption as string | undefined) ??
        (m.content as string | undefined) ??
        (m.conversation as string | undefined) ??
        (innerMsg.conversation as string | undefined) ??
        ((innerMsg.extendedTextMessage as Record<string, unknown> | undefined)?.text as
          | string
          | undefined) ??
        "";

      const mediaUrl =
        (m.mediaUrl as string | undefined) ??
        (m.fileUrl as string | undefined) ??
        (m.url as string | undefined);
      const mediaMime =
        (m.mimetype as string | undefined) ??
        (m.mimeType as string | undefined);

      const id =
        (m.id as string | undefined) ??
        ((m.key as Record<string, unknown> | undefined)?.id as string | undefined) ??
        `uaz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const ts =
        (m.messageTimestamp as number | undefined) ??
        (m.timestamp as number | undefined) ??
        Date.now() / 1000;

      out.push({
        providerMessageId: id,
        from,
        body,
        mediaUrl,
        mediaMime,
        timestamp: ts * (ts < 1e12 ? 1000 : 1),
        raw: p,
      });
    }
    return out;
  },
};
