// Anti-spam: máximo N mensajes entrantes por número en ventana de 1 minuto.
import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_PER_MINUTE = 8;
const BLOCK_MINUTES = 10;

export async function checkInboundAllowed(
  admin: SupabaseClient, phoneNumber: string
): Promise<{ allowed: boolean; reason?: string }> {
  const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString();
  const { data: existing } = await admin
    .from("whatsapp_rate_limits")
    .select("count, blocked_until")
    .eq("phone_number", phoneNumber)
    .eq("window_start", windowStart)
    .maybeSingle();
  if (existing?.blocked_until && new Date(existing.blocked_until) > new Date()) {
    return { allowed: false, reason: "blocked" };
  }
  const nextCount = (existing?.count ?? 0) + 1;
  if (nextCount > MAX_PER_MINUTE) {
    const until = new Date(Date.now() + BLOCK_MINUTES * 60_000).toISOString();
    await admin.from("whatsapp_rate_limits").upsert({
      phone_number: phoneNumber, window_start: windowStart, count: nextCount, blocked_until: until,
    });
    return { allowed: false, reason: "rate_limit" };
  }
  await admin.from("whatsapp_rate_limits").upsert({
    phone_number: phoneNumber, window_start: windowStart, count: nextCount,
  });
  return { allowed: true };
}
