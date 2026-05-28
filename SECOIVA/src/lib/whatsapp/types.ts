// Tipos compartidos del canal WhatsApp (provider-agnostic).

export type WhatsAppProviderName = "meta_cloud" | "evolution" | "placeholder";

export type InboundMessage = {
  providerMessageId: string;
  from: string; // E.164 sin "+"
  to?: string;
  body?: string;
  mediaUrl?: string;
  mediaMime?: string;
  timestamp: number;
  raw: unknown;
};

export type OutboundMessage = {
  to: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export type SendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

export interface WhatsAppProvider {
  name: WhatsAppProviderName;
  send(msg: OutboundMessage): Promise<SendResult>;
  parseWebhook(payload: unknown, signature?: string | null, rawBody?: string): Promise<InboundMessage[]>;
  verifyChallenge?(params: URLSearchParams): string | null;
}

export type BotIntent =
  | "saludo"
  | "solicitud_empleo"
  | "consulta_vacante"
  | "envio_cv"
  | "datos_personales"
  | "agradecimiento"
  | "desconocido";

export type ExtractedFields = {
  full_name?: string;
  email?: string;
  position?: string;
  city?: string;
  experience_years?: number;
};
