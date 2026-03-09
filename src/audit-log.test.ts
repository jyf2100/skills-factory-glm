import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import {
  writeAuditLog,
  readAuditLog,
  queryAuditLog,
  type AuditEntry,
} from './audit-log.js';

describe('audit-log', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp('/tmp/audit-log-test-');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('writeAuditLog', () => {
    it('should write audit log entry', async () => {
      const entry: AuditEntry = {
        action: 'install',
        skillName: 'test-skill',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        user: 'test-user',
        result: 'success',
      };

      await writeAuditLog(tmpDir, entry);

      const log = await readAuditLog(tmpDir);
      assert.strictEqual(log.entries.length, 1);
      assert.strictEqual(log.entries[0].action, 'install');
      assert.strictEqual(log.entries[0].skillName, 'test-skill');
    });

    it('should append multiple entries', async () => {
      const entry1: AuditEntry = {
        action: 'install',
        skillName: 'skill-a',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      };

      const entry2: AuditEntry = {
        action: 'uninstall',
        skillName: 'skill-a',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      };

      await writeAuditLog(tmpDir, entry1);
      await writeAuditLog(tmpDir, entry2);

      const log = await readAuditLog(tmpDir);
      assert.strictEqual(log.entries.length, 2);
    });
  });

  describe('readAuditLog', () => {
    it('should return empty log if file does not exist', async () => {
      const log = await readAuditLog(tmpDir);
      assert.strictEqual(log.entries.length, 0);
    });

    it('should read existing log', async () => {
      const entry: AuditEntry = {
        action: 'audit',
        skillName: 'existing-skill',
        timestamp: new Date().toISOString(),
        user: 'admin',
        result: 'failed',
      };

      await writeAuditLog(tmpDir, entry);
      const log = await readAuditLog(tmpDir);
      assert.strictEqual(log.entries.length, 1);
    });
  });

  describe('queryAuditLog', () => {
    it('should filter by action', async () => {
      await writeAuditLog(tmpDir, {
        action: 'install',
        skillName: 'skill-a',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      });
      await writeAuditLog(tmpDir, {
        action: 'uninstall',
        skillName: 'skill-b',
        timestamp: new Date().toISOString(),
        user: 'user2',
        result: 'success',
      });

      const installLogs = await queryAuditLog(tmpDir, { action: 'install' });
      assert.strictEqual(installLogs.length, 1);
      assert.strictEqual(installLogs[0].action, 'install');
    });

    it('should filter by skill name', async () => {
      await writeAuditLog(tmpDir, {
        action: 'install',
        skillName: 'skill-a',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      });
      await writeAuditLog(tmpDir, {
        action: 'install',
        skillName: 'skill-b',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      });

      const logs = await queryAuditLog(tmpDir, { skillName: 'skill-a' });
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].skillName, 'skill-a');
    });

    it('should filter by result', async () => {
      await writeAuditLog(tmpDir, {
        action: 'install',
        skillName: 'skill-a',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'success',
      });
      await writeAuditLog(tmpDir, {
        action: 'install',
        skillName: 'skill-b',
        timestamp: new Date().toISOString(),
        user: 'user1',
        result: 'failed',
      });

      const failedLogs = await queryAuditLog(tmpDir, { result: 'failed' });
      assert.strictEqual(failedLogs.length, 1);
      assert.strictEqual(failedLogs[0].result, 'failed');
    });
  });
});
