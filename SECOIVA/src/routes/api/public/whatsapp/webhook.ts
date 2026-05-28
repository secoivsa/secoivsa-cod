import { createFileRoute } from "@tanstack/react-router";
import { getWhatsAppProvider } from "@/lib/whatsapp/provider";
import { handleInboundAI } from "@/lib/whatsapp/ai-engine";
import { checkInboundAllowed } from "@/lib/whatsapp/anti-spam";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_ORG = "00000000-0000-0000-0000-000000000001";

async function rawLog(
  sessionId: string | null,
  level: "info" | "warning" | "error" | "debug",
  message: string,
  payload: Record<string, unknown>,
) {
  try {
    await supabaseAdmin.from("whatsapp_logs").insert({
      organization_id: DEFAULT_ORG,
      session_id: sessionId,
      level,
      message,
      payload: payload as never,
    });
  } catch (e) {
    console.error("[wa:webhook] rawLog failed", e);
  }
}

function readSecret(request: Request, url: URL): string | null {
  // Soporta múltiples convenciones que usan distintos proveedores / configs UAZAPI:
  // header x-webhook-secret, Authorization: Bearer, query ?secret=, ?token=, ?verify=
  return (
    request.headers.get("x-webhook-secret") ||
    request.headers.get("x-webhook-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret") ||
    url.searchParams.get("token") ||
    url.searchParams.get("verify") ||
    null
  );
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const secret = process.env.UAZAPI_WEBHOOK_SECRET;
        const got = readSecret(request, url);
        if (secret && got === secret) {
          return new Response(url.searchParams.get("challenge") ?? "ok", { status: 200 });
        }
        // Allow health-check style GET so UAZAPI / cron / curl pueden verificar URL viva
        if (url.searchParams.get("health") === "1") {
          return Response.json({ ok: true, ts: Date.now() });
        }
        const provider = getWhatsAppProvider();
        const challenge = provider.verifyChallenge?.(url.searchParams);
        if (challenge) return new Response(challenge, { status: 200 });
        return new Response("ok", { status: 200 });
      },

      POST: async ({ request }) => {
        const url = new URL(request.url);
        const raw = await request.text();
        const headersSnapshot: Record<string, string> = {};
        request.headers.forEach((v, k) => {
          if (/^(content-|x-|authorization)/i.test(k) || k.toLowerCase() === "user-agent") {
            headersSnapshot[k] = k.toLowerCase() === "authorization" ? "[redacted]" : v;
          }
        });

        // sesión actual (puede no existir todavía)
        const { data: session } = await supabaseAdmin
          .from("whatsapp_sessions")
          .select("id")
          .eq("organization_id", DEFAULT_ORG)
          .maybeSingle();
        const sessionId = session?.id ?? null;

        // ALWAYS log the hit ANTES de validar secret, así podemos debuggear si UAZAPI manda o no manda secret
        await rawLog(sessionId, "debug", "Webhook POST recibido", {
          headers: headersSnapshot,
          query: Object.fromEntries(url.searchParams.entries()),
          body_preview: raw.slice(0, 2000),
          body_length: raw.length,
        });

        const secret = process.env.UAZAPI_WEBHOOK_SECRET;
        if (secret) {
          const got = readSecret(request, url);
          if (got !== secret) {
            await rawLog(sessionId, "warning", "Webhook rechazado: secret inválido", {
              expected_len: secret.length,
              got_present: Boolean(got),
            });
            // Devolvemos 200 para que UAZAPI no marque webhook como roto, pero registramos
            return new Response("ok", { status: 200 });
          }
        }

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          await rawLog(sessionId, "error", "Webhook JSON inválido", { preview: raw.slice(0, 500) });
          return new Response("ok", { status: 200 });
        }

        const provider = getWhatsAppProvider();
        let messages;
        try {
          messages = await provider.parseWebhook(payload, request.headers.get("x-hub-signature-256"), raw);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "parse_error";
          await rawLog(sessionId, "error", `Webhook parse falló: ${msg}`, { payload: payload as Record<string, unknown> });
          return new Response("ok", { status: 200 });
        }

        if (!messages || messages.length === 0) {
          await rawLog(sessionId, "debug", "Webhook sin mensajes utilizables (evento informativo)", {
            payload_keys: Object.keys((payload as Record<string, unknown>) ?? {}),
          });
          return new Response("ok", { status: 200 });
        }

        for (const m of messages) {
          const allowed = await checkInboundAllowed(supabaseAdmin, m.from);
          await supabaseAdmin.from("whatsapp_queue").insert({
            organization_id: DEFAULT_ORG,
            session_id: sessionId,
            direction: "inbound",
            phone_number: m.from,
            body: m.body ?? null,
            media_url: m.mediaUrl ?? null,
            media_mime: m.mediaMime ?? null,
            media_kind: m.mediaMime?.startsWith("image/")
              ? "image"
              : m.mediaMime?.startsWith("audio/")
                ? "audio"
                : m.mediaMime === "application/pdf"
                  ? "document"
                  : m.mediaMime?.startsWith("video/")
                    ? "video"
                    : null,
            provider_message_id: m.providerMessageId,
            status: allowed.allowed ? "delivered" : "blocked",
            attempts: 1,
            last_error: allowed.allowed ? null : `anti-spam: ${allowed.reason}`,
          });

          await rawLog(
            sessionId,
            allowed.allowed ? "info" : "warning",
            allowed.allowed
              ? `Entrante ← +${m.from} "${(m.body ?? "").slice(0, 60)}"`
              : `Bloqueado anti-spam ← +${m.from}`,
            { phone: m.from, hasMedia: Boolean(m.mediaUrl), body: m.body?.slice(0, 240) ?? null },
          );

          if (!allowed.allowed) continue;
          try {
            await handleInboundAI(supabaseAdmin, m);
            await rawLog(sessionId, "info", `IA respondió → +${m.from}`, { phone: m.from });
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            console.error("[wa:webhook] handleInbound failed", e);
            await rawLog(sessionId, "error", `Fallo IA → +${m.from}: ${errMsg}`, {
              phone: m.from,
              stack: e instanceof Error ? e.stack?.slice(0, 1000) : null,
            });
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
