/**
 * NEXUS OS — Monitoring entrypoint.
 *
 * Today this exports a placeholder provider. When Sentry (or any other
 * vendor) is enabled, swap `activeProvider` for a real implementation —
 * no call site needs to change.
 */
import { placeholderProvider, getBufferedEvents, clearBufferedEvents } from "./placeholder-provider";
import type { MonitoringProvider } from "./types";

export type { MonitoringProvider, MonitoringEvent, MonitoringContext, Severity } from "./types";

const activeProvider: MonitoringProvider = placeholderProvider;

export const monitoring = activeProvider;

export const observability = {
  provider: activeProvider.name,
  ready: activeProvider.ready,
  mode: "placeholder" as const,
  getBufferedEvents,
  clearBufferedEvents,
};

/**
 * Lightweight logger built on top of the monitoring provider so app code
 * doesn't depend on console.* directly.
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    activeProvider.captureMessage({ message, severity: "debug", context });
  },
  info(message: string, context?: Record<string, unknown>) {
    activeProvider.captureMessage({ message, severity: "info", context });
  },
  warn(message: string, context?: Record<string, unknown>) {
    activeProvider.captureMessage({ message, severity: "warning", context });
  },
  error(error: unknown, context?: Record<string, unknown>) {
    activeProvider.captureException(error, context);
  },
};
