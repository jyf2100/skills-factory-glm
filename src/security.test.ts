import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateSkillMd,
  computeHash,
  detectSecurityIssues,
  auditSkill,
  type AuditResult,
} from './security.js';

describe('security', () => {
  describe('validateSkillMd', () => {
    it('should validate a proper SKILL.md', () => {
      const content = `---
name: test-skill
description: A test skill
---
# Test Skill
Content here.`;
      const result = validateSkillMd(content);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.name, 'test-skill');
      assert.strictEqual(result.description, 'A test skill');
    });

    it('should fail for missing frontmatter', () => {
      const content = `# Test Skill\nNo frontmatter here.`;
      const result = validateSkillMd(content);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('frontmatter'));
    });

    it('should fail for missing name', () => {
      const content = `---
description: A test skill
---
# Test Skill`;
      const result = validateSkillMd(content);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('name'));
    });

    it('should fail for missing description', () => {
      const content = `---
name: test-skill
---
# Test Skill`;
      const result = validateSkillMd(content);
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('description'));
    });
  });

  describe('computeHash', () => {
    it('should compute consistent hash for content', async () => {
      const content = 'test content';
      const hash1 = await computeHash(content);
      const hash2 = await computeHash(content);
      assert.strictEqual(hash1, hash2);
      assert.ok(hash1.length === 64); // SHA-256 hex string
    });

    it('should produce different hashes for different content', async () => {
      const hash1 = await computeHash('content 1');
      const hash2 = await computeHash('content 2');
      assert.notStrictEqual(hash1, hash2);
    });
  });

  describe('detectSecurityIssues', () => {
    it('should detect no issues in safe content', () => {
      const issues = detectSecurityIssues('skills/test-skill/SKILL.md', 'safe content');
      assert.strictEqual(issues.length, 0);
    });

    it('should detect API keys', () => {
      const issues = detectSecurityIssues(
        'skills/test-skill/SKILL.md',
        'api_key = sk-1234567890abcdef1234567890abcdef'
      );
      assert.ok(issues.some((i) => i.type === 'sensitive-pattern'));
    });

    it('should detect suspicious file patterns', () => {
      const issues = detectSecurityIssues('skills/test-skill/.env', '');
      assert.ok(issues.some((i) => i.type === 'suspicious-file'));
    });

    it('should detect shell scripts', () => {
      const issues = detectSecurityIssues('skills/test-skill/script.sh', '#!/bin/bash\necho "hello"');
      assert.ok(issues.some((i) => i.type === 'script'));
    });
  });

  describe('auditSkill', () => {
    const testSkillDir = path.join(process.cwd(), '.test-audit-skill');
    const skillMdPath = path.join(testSkillDir, 'SKILL.md');

    beforeEach(() => {
      fs.rmSync(testSkillDir, { recursive: true, force: true });
      fs.mkdirSync(testSkillDir, { recursive: true });
    });

    afterEach(() => {
      fs.rmSync(testSkillDir, { recursive: true, force: true });
    });

    it('should pass audit for valid skill', async () => {
      const skillMd = `---
name: valid-skill
description: A valid skill
---
# Valid Skill
This is safe content.`;
      fs.writeFileSync(skillMdPath, skillMd);

      const result = await auditSkill(testSkillDir);
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should fail audit for invalid SKILL.md', async () => {
      const skillMd = `# Invalid Skill\nNo frontmatter`;
      fs.writeFileSync(skillMdPath, skillMd);

      const result = await auditSkill(testSkillDir);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes('SKILL.md')));
    });

    it('should fail audit for missing SKILL.md', async () => {
      const result = await auditSkill(testSkillDir);
      assert.strictEqual(result.passed, false);
      assert.ok(result.errors.some((e) => e.includes('not found')));
    });
  });
});
