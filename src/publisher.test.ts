import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  createRepository,
  generateAttestation,
  updateIndex,
  gitInit,
  gitAdd,
  gitCommit,
  type SkillRecord,
  type SkillsIndex,
} from './publisher.js';
import { generateKeyPair } from './signing.js';

describe('publisher', () => {
  let keyPair: { publicKey: string; privateKey: string };

  beforeEach(() => {
    keyPair = generateKeyPair();
  });

  describe('createRepository', () => {
    it('should generate skill directory path', () => {
      const repo = createRepository('/path/to/repo');
      assert.strictEqual(
        repo.getSkillPath('my-skill', '1.0.0'),
        '/path/to/repo/skills/my-skill/1.0.0'
      );
    });

    it('should generate metadata path', () => {
      const repo = createRepository('/path/to/repo');
      assert.strictEqual(
        repo.getMetadataPath('my-skill', '1.0.0'),
        '/path/to/repo/metadata/my-skill/1.0.0.json'
      );
    });

    it('should generate attestation path', () => {
      const repo = createRepository('/path/to/repo');
      assert.strictEqual(
        repo.getAttestationPath('my-skill', '1.0.0'),
        '/path/to/repo/attestations/my-skill/1.0.0.json'
      );
    });

    it('should generate signature path', () => {
      const repo = createRepository('/path/to/repo');
      assert.strictEqual(
        repo.getSignaturePath('my-skill', '1.0.0'),
        '/path/to/repo/signatures/my-skill/1.0.0.sig'
      );
    });

    it('should generate index path', () => {
      const repo = createRepository('/path/to/repo');
      assert.strictEqual(repo.getIndexPath(), '/path/to/repo/index/skills-index.json');
    });
  });

  describe('generateAttestation', () => {
    it('should generate attestation for published skill', () => {
      const record: SkillRecord = {
        skillId: 'test-skill',
        version: '1.0.0',
        sourceUrl: 'https://github.com/a/b',
        sourceCommit: 'abc123',
        hash: 'sha256:deadbeef',
        fetchedAt: '2026-03-05T10:00:00Z',
        riskLevel: 'low',
      };
      const attestation = generateAttestation(record, 'reviewer', keyPair.privateKey);

      assert.strictEqual(attestation.skillId, 'test-skill');
      assert.strictEqual(attestation.version, '1.0.0');
      assert.strictEqual(attestation.source, 'https://github.com/a/b');
      assert.ok(attestation.signature);
      assert.strictEqual(attestation.signedBy, 'reviewer');
    });

    it('should include review timestamp', () => {
      const record: SkillRecord = {
        skillId: 'test-skill',
        version: '1.0.0',
        sourceUrl: 'https://github.com/a/b',
        sourceCommit: 'abc123',
        hash: 'sha256:deadbeef',
        fetchedAt: '2026-03-05T10:00:00Z',
        riskLevel: 'low',
      };
      const attestation = generateAttestation(record, 'reviewer', keyPair.privateKey);

      assert.ok(attestation.reviewedAt);
      assert.ok(attestation.publishedAt);
    });
  });

  describe('updateIndex', () => {
    it('should add new skill to empty index', () => {
      const existingIndex: SkillsIndex = { version: 1, skills: [] };
      const newSkill = {
        skillId: 'new-skill',
        version: '1.0.0',
        description: 'A new skill',
        riskLevel: 'low',
      };
      const updated = updateIndex(existingIndex, newSkill);

      assert.strictEqual(updated.skills.length, 1);
      assert.strictEqual(updated.skills[0].skillId, 'new-skill');
    });

    it('should add new skill to existing index', () => {
      const existingIndex: SkillsIndex = {
        version: 1,
        skills: [{ skillId: 'existing-skill', version: '1.0.0', description: 'Existing', riskLevel: 'low' }],
      };
      const newSkill = {
        skillId: 'new-skill',
        version: '1.0.0',
        description: 'A new skill',
        riskLevel: 'low',
      };
      const updated = updateIndex(existingIndex, newSkill);

      assert.strictEqual(updated.skills.length, 2);
    });

    it('should update existing skill version', () => {
      const existingIndex: SkillsIndex = {
        version: 1,
        skills: [{ skillId: 'my-skill', version: '1.0.0', description: 'My skill', riskLevel: 'low' }],
      };
      const updatedSkill = {
        skillId: 'my-skill',
        version: '2.0.0',
        description: 'Updated skill',
        riskLevel: 'low',
      };
      const updated = updateIndex(existingIndex, updatedSkill);

      assert.strictEqual(updated.skills.length, 1);
      assert.strictEqual(updated.skills[0].version, '2.0.0');
      assert.strictEqual(updated.skills[0].description, 'Updated skill');
    });
  });

  describe('gitInit', () => {
    it('should initialize git repo in a directory', async () => {
      const tmpDir = await import('node:fs/promises').then(fs =>
        fs.mkdtemp('/tmp/skills-factory-test-')
      );

      try {
        const result = await gitInit(tmpDir);
        assert.strictEqual(result.success, true);
        assert.ok(result.message);
      } finally {
        // Cleanup
        await import('node:fs/promises').then(fs =>
          fs.rm(tmpDir, { recursive: true, force: true })
        );
      }
    });

    it('should handle already initialized repo', async () => {
      const tmpDir = await import('node:fs/promises').then(fs =>
        fs.mkdtemp('/tmp/skills-factory-test-')
      );

      try {
        await gitInit(tmpDir);
        // Second init should succeed (no-op)
        const result = await gitInit(tmpDir);
        assert.strictEqual(result.success, true);
      } finally {
        await import('node:fs/promises').then(fs =>
          fs.rm(tmpDir, { recursive: true, force: true })
        );
      }
    });
  });

  describe('gitAdd', () => {
    it('should stage files in repo', async () => {
      const tmpDir = await import('node:fs/promises').then(fs =>
        fs.mkdtemp('/tmp/skills-factory-test-')
      );

      try {
        await gitInit(tmpDir);
        // Create a test file
        const testFile = `${tmpDir}/test.txt`;
        await import('node:fs/promises').then(fs => fs.writeFile(testFile, 'test'));

        const result = await gitAdd(tmpDir, ['.']);
        assert.strictEqual(result.success, true);
      } finally {
        await import('node:fs/promises').then(fs =>
          fs.rm(tmpDir, { recursive: true, force: true })
        );
      }
    });
  });

  describe('gitCommit', () => {
    it('should commit staged changes', async () => {
      const fs = await import('node:fs/promises');
      const tmpDir = await fs.mkdtemp('/tmp/skills-factory-test-');

      try {
        await gitInit(tmpDir);
        await fs.writeFile(`${tmpDir}/test.txt`, 'test content');
        await gitAdd(tmpDir, ['.']);

        const result = await gitCommit(tmpDir, 'Test commit');
        assert.strictEqual(result.success, true);
        assert.ok(result.commitHash);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
