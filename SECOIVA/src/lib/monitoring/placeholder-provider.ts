import type { MonitoringContext, MonitoringEvent, MonitoringProvider } from "./types";

/**
 * Placeholder monitoring provider — buffers events locally until a real
 * provider (Sentry) is wired in during the final hardening phase.
 * Safe in SSR and the browser; never throws.
 */
const BUFFER_LIMIT = 200;

type BufferedEntry = {
  ts: number;
  kind: "exception" | "message" | "breadcrumb";
  payload: unknown;
};

const buffer: BufferedEntry[] = [];

function push(entry: BufferedEntry) {
  buffer.push(entry);
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
}

export const placeholderProvider: MonitoringProvider = {
  name: "placeholder",
  ready: true,
  init() {
    /* no-op until real DSN provided */
  },
  captureException(error: unknown, context?: MonitoringContext) {
    const message = error instanceof Error ? error.message : String(error);
    push({ ts: Date.now(), kind: "exception", payload: { message, context } });
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.error("[monitoring:placeholder]", message, context ?? {});
    }
  },
  captureMessage(event: MonitoringEvent) {
    push({ ts: Date.now(), kind: "message", payload: event });
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.info("[monitoring:placeholder]", event.message, event.context ?? {});
    }
  },
  setUser() {
    /* no-op */
  },
  addBreadcrumb(crumb) {
    push({ ts: Date.now(), kind: "breadcrumb", payload: crumb });
  },
};

export function getBufferedEvents(): ReadonlyArray<BufferedEntry> {
  return buffer;
}

export function clearBufferedEvents() {
  buffer.length = 0;
}
