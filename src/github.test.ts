import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { GitHubClient, parseGitHubSource, downloadSkill } from './github.js';

describe('github', () => {
  describe('parseGitHubSource', () => {
    it('should parse owner/repo format', () => {
      const result = parseGitHubSource('owner/repo');
      assert.deepStrictEqual(result, {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        skillPath: '',
      });
    });

    it('should parse owner/repo with subpath', () => {
      const result = parseGitHubSource('owner/repo/skills/my-skill');
      assert.deepStrictEqual(result, {
        owner: 'owner',
        repo: 'repo',
        branch: 'main',
        skillPath: 'skills/my-skill',
      });
    });

    it('should throw for invalid format', () => {
      assert.throws(
        () => parseGitHubSource('invalid'),
        /Invalid GitHub source/
      );
    });
  });

  describe('GitHubClient', () => {
    it('should create client without token', () => {
      const client = new GitHubClient();
      assert.ok(client);
    });
  });

  describe('downloadSkill', () => {
    const testDir = path.join(process.cwd(), '.test-download');

    beforeEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
      fs.mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    it('should fail for non-existent repo', async () => {
      const source = parseGitHubSource('nonexistent-owner-xyz/nonexistent-repo-xyz');
      try {
        await downloadSkill(source, testDir);
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error instanceof Error);
        assert.ok(
          error.message.includes('404') ||
          error.message.includes('Not Found') ||
          error.message.includes('Failed to fetch')
        );
      }
    });
  });
});
