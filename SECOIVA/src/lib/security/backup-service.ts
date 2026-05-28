/**
 * NEXUS OS — Backup service abstraction.
 *
 * Lovable Cloud (managed Postgres) handles automatic backups at the
 * platform level. This module exposes a uniform interface so the app can
 * surface backup status and, eventually, on-demand exports (CSV/SQL dump
 * via signed URL) without changing call sites.
 */
export type BackupKind = "full" | "incremental" | "export";
export type BackupStatus = "scheduled" | "running" | "ready" | "failed";

export interface BackupRecord {
  id: string;
  kind: BackupKind;
  status: BackupStatus;
  createdAt: string;
  sizeBytes?: number;
  downloadUrl?: string;
}

export interface BackupProvider {
  readonly name: string;
  readonly managed: boolean;
  readonly retentionDays: number;
  list(): Promise<BackupRecord[]>;
  requestExport(scope: { table?: string }): Promise<BackupRecord>;
}

export const backupProvider: BackupProvider = {
  name: "lovable-cloud-managed",
  managed: true,
  retentionDays: 7,
  async list() {
    // Managed backups are not exposed via API today.
    return [];
  },
  async requestExport() {
    throw new Error("On-demand exports not yet wired to the platform backup API.");
  },
};
