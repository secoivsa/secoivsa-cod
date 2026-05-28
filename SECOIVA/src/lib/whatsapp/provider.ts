import { metaCloudProvider } from "./providers/meta-cloud";
import { evolutionProvider } from "./providers/evolution";
import { placeholderProvider } from "./providers/placeholder";
import { uazapiProvider } from "./providers/uazapi";
import type { WhatsAppProvider } from "./types";

// Selecciona provider según WHATSAPP_PROVIDER env. Default = uazapi cuando hay UAZAPI_URL.
export function getWhatsAppProvider(): WhatsAppProvider {
  const explicit = (process.env.WHATSAPP_PROVIDER ?? "").toLowerCase();
  if (explicit === "meta_cloud" || explicit === "meta") return metaCloudProvider;
  if (explicit === "evolution") return evolutionProvider;
  if (explicit === "uazapi") return uazapiProvider;
  if (explicit === "placeholder") return placeholderProvider;
  // Auto-detect
  if (process.env.UAZAPI_URL && process.env.UAZAPI_INSTANCE_TOKEN) return uazapiProvider;
  if (process.env.EVOLUTION_URL) return evolutionProvider;
  if (process.env.META_WHATSAPP_TOKEN) return metaCloudProvider;
  return placeholderProvider;
}
