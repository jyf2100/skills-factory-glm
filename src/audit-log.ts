/**
 * Audit Log Module
 *
 * Records all operations for traceability and compliance
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export type AuditAction =
  | 'install'
  | 'uninstall'
  | 'update'
  | 'audit'
  | 'verify'
  | 'publish'
  | 'approve'
  | 'reject'
  | 'import';

export type AuditResult = 'success' | 'failed' | 'pending';

export interface AuditEntry {
  action: AuditAction;
  skillName: string;
  version?: string;
  timestamp: string;
  user: string;
  result: AuditResult;
  source?: string;
  hash?: string;
  message?: string;
  correlationId?: string;
}

export interface AuditLog {
  version: number;
  entries: AuditEntry[];
}

const AUDIT_LOG_FILE = 'audit-log.json';

/**
 * Get the path to the audit log file
 */
function getAuditLogPath(baseDir: string): string {
  return path.join(baseDir, AUDIT_LOG_FILE);
}

/**
 * Read the audit log, create if not exists
 */
export async function readAuditLog(baseDir: string): Promise<AuditLog> {
  const logPath = getAuditLogPath(baseDir);

  try {
    const content = await fs.readFile(logPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { version: 1, entries: [] };
  }
}

/**
 * Write a new entry to the audit log
 */
export async function writeAuditLog(
  baseDir: string,
  entry: AuditEntry
): Promise<void> {
  const log = await readAuditLog(baseDir);
  log.entries.push(entry);
  await fs.writeFile(getAuditLogPath(baseDir), JSON.stringify(log, null, 2));
}

/**
 * Query the audit log with filters
 */
export async function queryAuditLog(
  baseDir: string,
  filters: {
    action?: AuditAction;
    skillName?: string;
    user?: string;
    result?: AuditResult;
    correlationId?: string;
  }
): Promise<AuditEntry[]> {
  const log = await readAuditLog(baseDir);

  return log.entries.filter((entry) => {
    if (filters.action && entry.action !== filters.action) return false;
    if (filters.skillName && entry.skillName !== filters.skillName) return false;
    if (filters.user && entry.user !== filters.user) return false;
    if (filters.result && entry.result !== filters.result) return false;
    if (filters.correlationId && entry.correlationId !== filters.correlationId)
      return false;
    return true;
  });
}

/**
 * Generate a correlation ID for linking related operations
 */
export function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create an audit entry
 */
export function createAuditEntry(
  action: AuditAction,
  skillName: string,
  user: string,
  options?: {
    version?: string;
    source?: string;
    hash?: string;
    result?: AuditResult;
    message?: string;
    correlationId?: string;
  }
): AuditEntry {
  return {
    action,
    skillName,
    timestamp: new Date().toISOString(),
    user,
    result: options?.result || 'success',
    version: options?.version,
    source: options?.source,
    hash: options?.hash,
    message: options?.message,
    correlationId: options?.correlationId,
  };
}
