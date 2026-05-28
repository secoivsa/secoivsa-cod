/**
 * NEXUS OS — Monitoring Provider Interface
 *
 * Abstraction layer so the app can swap between a no-op placeholder
 * (current) and a real provider (Sentry / Datadog / OTel) later
 * without touching call sites.
 */
export type Severity = "debug" | "info" | "warning" | "error" | "fatal";

export interface MonitoringContext {
  userId?: string;
  orgId?: string;
  route?: string;
  [key: string]: unknown;
}

export interface MonitoringEvent {
  message: string;
  severity?: Severity;
  context?: MonitoringContext;
  tags?: Record<string, string>;
}

export interface MonitoringProvider {
  readonly name: string;
  readonly ready: boolean;
  init(): Promise<void> | void;
  captureException(error: unknown, context?: MonitoringContext): void;
  captureMessage(event: MonitoringEvent): void;
  setUser(user: { id: string; email?: string; orgId?: string } | null): void;
  addBreadcrumb(crumb: { category: string; message: string; data?: Record<string, unknown> }): void;
}
