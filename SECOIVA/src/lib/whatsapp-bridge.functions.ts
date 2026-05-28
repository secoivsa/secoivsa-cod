// Server functions para gestionar el bridge WhatsApp (UAZAPI).
// QR, status, reconnect, logs, queue, anti-spam.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  uazapiConnect, uazapiStatus, uazapiDisconnect, uazapiSendMedia,
} from "@/lib/whatsapp/providers/uazapi";
import { getWhatsAppProvider } from "@/lib/whatsapp/provider";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";
const INSTANCE = process.env.UAZAPI_INSTANCE_NAME ?? "rh-secoivsa";

async function getOrCreateSession() {
  const { data: existing } = await supabaseAdmin
    .from("whatsapp_sessions")
    .select("*")
    .eq("organization_id", DEFAULT_ORG)
    .eq("instance_name", INSTANCE)
    .maybeSingle();
  if (existing) return existing;
  const { data: created, error } = await supabaseAdmin
    .from("whatsapp_sessions")
    .insert({
      organization_id: DEFAULT_ORG, instance_name: INSTANCE,
      provider: "uazapi", status: "disconnected",
    })
    .select("*").single();
  if (error) throw new Error(error.message);
  return created;
}

async function log(sessionId: string, level: "info"|"warning"|"error"|"debug", message: string, payload: Record<string, unknown> = {}) {
  await supabaseAdmin.from("whatsapp_logs").insert({
    organization_id: DEFAULT_ORG, session_id: sessionId, level, message,
    payload: payload as never,
  });
}

export const getBridgeStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await getOrCreateSession();
    const remote = await uazapiStatus();
    if (remote.status !== "error") {
      await supabaseAdmin.from("whatsapp_sessions").update({
        status: remote.status === "connected" ? "connected" : session.status,
        phone_number: remote.phone_number ?? session.phone_number,
        last_seen_at: remote.status === "connected" ? new Date().toISOString() : session.last_seen_at,
        last_error: null,
      }).eq("id", session.id);
    }
    const { data: fresh } = await supabaseAdmin
      .from("whatsapp_sessions").select("*").eq("id", session.id).single();
    return {
      session: fresh,
      remote: { status: remote.status, phone_number: remote.phone_number ?? null, qr_base64: remote.qr_base64 ?? null },
      provider: getWhatsAppProvider().name,
      configured: Boolean(process.env.UAZAPI_URL && process.env.UAZAPI_INSTANCE_TOKEN),
    };
  });

export const requestQR = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await getOrCreateSession();
    await log(session.id, "info", "QR solicitado");
    const r = await uazapiConnect();
    const update: {
      status?: typeof r.status; last_error?: string | null;
      qr_base64?: string | null; qr_expires_at?: string | null;
      phone_number?: string | null; last_seen_at?: string | null;
    } = { status: r.status, last_error: null };
    if (r.qr_base64) {
      update.qr_base64 = r.qr_base64;
      update.qr_expires_at = new Date(Date.now() + 60_000).toISOString();
    }
    if (r.status === "connected" && r.phone_number) {
      update.phone_number = r.phone_number;
      update.last_seen_at = new Date().toISOString();
    }
    if (r.status === "error") {
      update.last_error = JSON.stringify(r.raw);
      await log(session.id, "error", "QR fallo", { raw: r.raw });
    } else {
      await log(session.id, "info", `QR estado: ${r.status}`);
    }
    await supabaseAdmin.from("whatsapp_sessions").update(update as never).eq("id", session.id);
    return { status: r.status, qr_base64: r.qr_base64 ?? null, phone_number: r.phone_number ?? null };
  });

export const disconnectBridge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await getOrCreateSession();
    const ok = await uazapiDisconnect();
    await supabaseAdmin.from("whatsapp_sessions").update({
      status: "disconnected", qr_base64: null, qr_expires_at: null,
    }).eq("id", session.id);
    await log(session.id, "warning", ok ? "Desconectado por usuario" : "Desconexión solicitada (provider error)");
    return { ok };
  });

export const listLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("whatsapp_logs").select("*")
      .eq("organization_id", DEFAULT_ORG)
      .order("created_at", { ascending: false }).limit(100);
    return { logs: data ?? [] };
  });

export const listQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data } = await supabaseAdmin
      .from("whatsapp_queue").select("*")
      .eq("organization_id", DEFAULT_ORG)
      .order("created_at", { ascending: false }).limit(50);
    return { items: data ?? [] };
  });

export const retryQueueItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: item } = await supabaseAdmin
      .from("whatsapp_queue").select("*").eq("id", data.id).single();
    if (!item || item.direction !== "outbound") throw new Error("item not found");
    const provider = getWhatsAppProvider();
    const r = item.media_url
      ? await uazapiSendMedia(item.phone_number, item.media_url, (item.media_kind ?? "document") as "image"|"document"|"audio"|"video", item.body ?? undefined)
      : await provider.send({ to: item.phone_number, body: item.body ?? "" });
    await supabaseAdmin.from("whatsapp_queue").update({
      status: r.ok ? "sent" : "failed",
      attempts: (item.attempts ?? 0) + 1,
      last_error: r.ok ? null : r.error ?? "send error",
      provider_message_id: r.providerMessageId ?? item.provider_message_id,
    }).eq("id", data.id);
    return { ok: r.ok };
  });

export const sendBridgeMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string; body?: string; mediaUrl?: string; mediaKind?: "image"|"document"|"audio"|"video"; candidateId?: string }) =>
    z.object({
      to: z.string().min(6).max(20),
      body: z.string().max(4000).optional(),
      mediaUrl: z.string().url().optional(),
      mediaKind: z.enum(["image","document","audio","video"]).optional(),
      candidateId: z.string().uuid().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const session = await getOrCreateSession();
    const { data: queued } = await supabaseAdmin.from("whatsapp_queue").insert({
      organization_id: DEFAULT_ORG, session_id: session.id, direction: "outbound",
      phone_number: data.to, body: data.body ?? null,
      media_url: data.mediaUrl ?? null, media_kind: data.mediaKind ?? null,
      candidate_id: data.candidateId ?? null, status: "processing",
    }).select("id").single();
    const id = queued?.id as string;
    const provider = getWhatsAppProvider();
    const r = data.mediaUrl
      ? await uazapiSendMedia(data.to, data.mediaUrl, data.mediaKind ?? "document", data.body)
      : await provider.send({ to: data.to, body: data.body ?? "" });
    await supabaseAdmin.from("whatsapp_queue").update({
      status: r.ok ? "sent" : "failed",
      attempts: 1, last_error: r.ok ? null : r.error ?? "send error",
      provider_message_id: r.providerMessageId ?? null,
    }).eq("id", id);
    await log(session.id, r.ok ? "info" : "error",
      r.ok ? `Saliente → ${data.to}` : `Fallo envío → ${data.to}: ${r.error}`,
      { to: data.to, hasMedia: Boolean(data.mediaUrl) });
    return { ok: r.ok, id, error: r.error ?? null };
  });

// ---------- DEBUG & TEST ----------

export const getBridgeDebugInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await getOrCreateSession();
    const { data: rawLogs } = await supabaseAdmin
      .from("whatsapp_logs")
      .select("*")
      .eq("organization_id", DEFAULT_ORG)
      .order("created_at", { ascending: false })
      .limit(40);
    const env = {
      UAZAPI_URL: Boolean(process.env.UAZAPI_URL),
      UAZAPI_INSTANCE_TOKEN: Boolean(process.env.UAZAPI_INSTANCE_TOKEN),
      UAZAPI_WEBHOOK_SECRET: Boolean(process.env.UAZAPI_WEBHOOK_SECRET),
      UAZAPI_ADMIN_TOKEN: Boolean(process.env.UAZAPI_ADMIN_TOKEN),
      LOVABLE_API_KEY: Boolean(process.env.LOVABLE_API_KEY),
      provider: getWhatsAppProvider().name,
    };
    return { session, logs: rawLogs ?? [], env };
  });

export const pingProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const session = await getOrCreateSession();
    const remote = await uazapiStatus();
    await log(session.id, "info", `Ping provider · status=${remote.status}`, { remote: remote.raw as Record<string, unknown> });
    return { status: remote.status, phone: remote.phone_number ?? null, raw: JSON.stringify(remote.raw ?? null).slice(0, 2000) };
  });

export const sendTestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string; body?: string }) =>
    z.object({
      to: z.string().min(8).max(20),
      body: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const session = await getOrCreateSession();
    const to = data.to.replace(/\D/g, "");
    const body = data.body ?? `🧪 Test SECOIVSA · ${new Date().toLocaleTimeString()}`;
    const provider = getWhatsAppProvider();
    const r = await provider.send({ to, body });
    await supabaseAdmin.from("whatsapp_queue").insert({
      organization_id: DEFAULT_ORG,
      session_id: session.id,
      direction: "outbound",
      phone_number: to,
      body,
      status: r.ok ? "sent" : "failed",
      attempts: 1,
      last_error: r.ok ? null : r.error ?? "send error",
      provider_message_id: r.providerMessageId ?? null,
    });
    await log(
      session.id,
      r.ok ? "info" : "error",
      r.ok ? `TEST → +${to} enviado` : `TEST → +${to} falló: ${r.error}`,
      { to, ok: r.ok, error: r.error ?? null },
    );
    return { ok: r.ok, error: r.error ?? null, providerMessageId: r.providerMessageId ?? null };
  });

export const simulateInbound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; body: string }) =>
    z.object({
      from: z.string().min(8).max(20),
      body: z.string().min(1).max(1000),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const session = await getOrCreateSession();
    const from = data.from.replace(/\D/g, "");
    const { handleInboundAI } = await import("@/lib/whatsapp/ai-engine");
    const fakeMsg = {
      providerMessageId: `sim_${Date.now()}`,
      from,
      body: data.body,
      timestamp: Date.now(),
      raw: { simulated: true },
    };
    await supabaseAdmin.from("whatsapp_queue").insert({
      organization_id: DEFAULT_ORG,
      session_id: session.id,
      direction: "inbound",
      phone_number: from,
      body: data.body,
      provider_message_id: fakeMsg.providerMessageId,
      status: "delivered",
      attempts: 1,
      last_error: "simulated",
    });
    await log(session.id, "info", `SIM inbound ← +${from} "${data.body.slice(0, 60)}"`, { simulated: true });
    try {
      await handleInboundAI(supabaseAdmin, fakeMsg);
      await log(session.id, "info", `SIM IA respondió → +${from}`, {});
      return { ok: true, error: null };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await log(session.id, "error", `SIM IA falló: ${errMsg}`, {});
      return { ok: false, error: errMsg };
    }
  });
