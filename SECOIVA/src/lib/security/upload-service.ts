import { supabase } from "@/integrations/supabase/client";

/**
 * NEXUS OS — Secure upload service.
 * - Validates MIME type and size client-side BEFORE upload
 * - Forces private buckets only (no public storage)
 * - Generates signed URLs with TTL for read access
 * - Antivirus hook: `scanProvider` is a swap point for ClamAV / VirusTotal
 *   (currently no-op; flagged as "not active" in the security dashboard)
 */
export const PRIVATE_BUCKETS = ["evidences", "employee-docs"] as const;
export type PrivateBucket = (typeof PRIVATE_BUCKETS)[number];

export const UPLOAD_POLICIES: Record<PrivateBucket, { maxBytes: number; mime: RegExp }> = {
  evidences:      { maxBytes: 25 * 1024 * 1024, mime: /^(image\/(png|jpe?g|webp|gif)|application\/pdf|video\/(mp4|webm))$/ },
  "employee-docs": { maxBytes: 15 * 1024 * 1024, mime: /^(image\/(png|jpe?g|webp)|application\/pdf)$/ },
};

export type UploadValidation =
  | { ok: true }
  | { ok: false; reason: "mime" | "size" | "empty" | "bucket"; message: string };

export function validateUpload(bucket: string, file: File): UploadValidation {
  if (!file || file.size === 0) return { ok: false, reason: "empty", message: "Archivo vacío." };
  const policy = UPLOAD_POLICIES[bucket as PrivateBucket];
  if (!policy) return { ok: false, reason: "bucket", message: `Bucket no permitido: ${bucket}` };
  if (file.size > policy.maxBytes) {
    return { ok: false, reason: "size", message: `Excede ${(policy.maxBytes / 1024 / 1024).toFixed(0)} MB.` };
  }
  if (!policy.mime.test(file.type)) {
    return { ok: false, reason: "mime", message: `Tipo no permitido: ${file.type || "desconocido"}` };
  }
  return { ok: true };
}

/** Antivirus abstraction — swap implementation later (ClamAV/VirusTotal). */
export interface AntivirusProvider {
  readonly name: string;
  readonly ready: boolean;
  scan(file: File): Promise<{ clean: boolean; engine: string; reason?: string }>;
}
export const scanProvider: AntivirusProvider = {
  name: "noop",
  ready: false,
  async scan() {
    return { clean: true, engine: "noop" };
  },
};

export async function secureUpload(bucket: PrivateBucket, path: string, file: File) {
  const v = validateUpload(bucket, file);
  if (!v.ok) throw new Error(v.message);
  const scan = await scanProvider.scan(file);
  if (!scan.clean) throw new Error(`Archivo rechazado por antivirus: ${scan.reason ?? "infected"}`);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return { bucket, path };
}

export async function signedReadUrl(bucket: PrivateBucket, path: string, ttlSeconds = 300) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error) throw error;
  return data.signedUrl;
}
