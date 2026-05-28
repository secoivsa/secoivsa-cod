import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/interview-reminders")({
  server: {
    handlers: {
      POST: async () => {
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in22h = new Date(now.getTime() + 22 * 60 * 60 * 1000);

        const { data: interviews } = await supabaseAdmin
          .from("interviews")
          .select("id, scheduled_at, mode, location, candidate:candidates(full_name, phone)")
          .in("status", ["programada", "confirmada"])
          .is("reminder_sent_at", null)
          .gte("scheduled_at", in22h.toISOString())
          .lte("scheduled_at", in24h.toISOString());

        if (!interviews?.length) {
          return new Response(JSON.stringify({ ok: true, processed: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const { getWhatsAppProvider } = await import("@/lib/whatsapp/provider");
        const provider = getWhatsAppProvider();
        let sent = 0;
        for (const iv of interviews) {
          const cand = Array.isArray(iv.candidate) ? iv.candidate[0] : iv.candidate;
          if (!cand?.phone) continue;
          const dateStr = new Date(iv.scheduled_at).toLocaleString("es-MX", {
            dateStyle: "full", timeStyle: "short",
          });
          const body =
            `Recordatorio SECOIVSA RH 🔔\n\n` +
            `Hola ${cand.full_name?.split(" ")[0] ?? ""}, tu entrevista es mañana:\n` +
            `📅 ${dateStr}\n` +
            `📍 ${iv.mode === "presencial" ? (iv.location ?? "Oficinas SECOIVSA") : iv.mode}\n\n` +
            `Responde *CONFIRMO* para confirmar tu asistencia.`;
          const res = await provider.send({ to: cand.phone, body });
          if (res.ok) {
            sent++;
            await supabaseAdmin.from("interviews")
              .update({ reminder_sent_at: new Date().toISOString() })
              .eq("id", iv.id);
            const { data: ivRow } = await supabaseAdmin.from("interviews").select("candidate_id").eq("id", iv.id).single();
            if (ivRow?.candidate_id) {
              await supabaseAdmin.from("candidate_messages").insert({
                candidate_id: ivRow.candidate_id,
                direction: "out",
                channel: "whatsapp",
                body,
                provider_message_id: res.providerMessageId,
                metadata: { auto: true, kind: "interview_reminder_24h" },
              });
            }
          }
        }
        return new Response(JSON.stringify({ ok: true, processed: sent }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
